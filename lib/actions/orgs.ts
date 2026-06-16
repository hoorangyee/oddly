"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { getOrgBySlug } from "../data";
import { hashKey, verifyKey, newInviteCode, newAdminKey } from "../keys";
import { isSuperAdmin, isOrgAdmin, setMemberSession } from "../auth";
import { createOrgSchema, joinSchema, loginSchema } from "../validation";
import { MarketStatus, BetStatus } from "../constants";

export type CreateOrgState =
  | { ok: true; name: string; slug: string; inviteCode: string; adminKey: string }
  | { error: string }
  | null;

export async function createOrganization(
  _prev: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  if (!(await isSuperAdmin())) return { error: "권한이 없습니다" };

  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    startingBalance: formData.get("startingBalance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };
  }

  const existing = await getOrgBySlug(parsed.data.slug);
  if (existing) return { error: "이미 사용 중인 slug 입니다" };

  const inviteCode = newInviteCode();
  const adminKey = newAdminKey();
  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      startingBalance: parsed.data.startingBalance,
      inviteCode,
      adminKeyHash: hashKey(adminKey),
    },
  });

  revalidatePath("/admin");
  // adminKey 는 여기서 한 번만 노출(해시만 저장됨)
  return { ok: true, name: org.name, slug: org.slug, inviteCode, adminKey };
}

export async function deleteOrganization(formData: FormData): Promise<void> {
  if (!(await isSuperAdmin())) throw new Error("권한이 없습니다");
  const id = String(formData.get("orgId") ?? "");
  if (id) await prisma.organization.delete({ where: { id } });
  revalidatePath("/admin");
}

// 가입 — 신규 생성, 또는 PIN 미설정(레거시) 계정의 PIN 클레임. 둘 다 초대코드 필요.
export async function joinOrg(_prev: { error?: string } | null, formData: FormData) {
  const slug = String(formData.get("orgSlug") ?? "");
  const parsed = joinSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    nickname: formData.get("nickname"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };
  const { nickname, pin } = parsed.data;

  const org = await getOrgBySlug(slug);
  if (!org) return { error: "조직을 찾을 수 없습니다" };
  if (parsed.data.inviteCode.toUpperCase() !== org.inviteCode.toUpperCase()) {
    return { error: "초대 코드가 올바르지 않습니다" };
  }

  const existing = await prisma.member.findUnique({
    where: { orgId_nickname: { orgId: org.id, nickname } },
  });

  if (existing) {
    // PIN 이 이미 있으면 가입 불가(로그인으로 유도), 없으면 클레임(레거시 계정에 PIN 설정)
    if (existing.pinHash) {
      return { error: "이미 사용 중인 닉네임입니다. 로그인을 이용하세요." };
    }
    await prisma.member.update({ where: { id: existing.id }, data: { pinHash: hashKey(pin) } });
    await setMemberSession({ memberId: existing.id, nickname: existing.nickname, orgId: org.id });
    redirect(`/${slug}`);
  }

  let member;
  try {
    member = await prisma.member.create({
      data: { orgId: org.id, nickname, balance: org.startingBalance, pinHash: hashKey(pin) },
    });
  } catch {
    return { error: "이미 사용 중인 닉네임입니다. 로그인을 이용하세요." };
  }
  await setMemberSession({ memberId: member.id, nickname: member.nickname, orgId: org.id });
  redirect(`/${slug}`);
}

// 재로그인 — 닉네임 + PIN
export async function memberLogin(_prev: { error?: string } | null, formData: FormData) {
  const slug = String(formData.get("orgSlug") ?? "");
  const parsed = loginSchema.safeParse({
    nickname: formData.get("nickname"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };

  const org = await getOrgBySlug(slug);
  if (!org) return { error: "조직을 찾을 수 없습니다" };

  const member = await prisma.member.findUnique({
    where: { orgId_nickname: { orgId: org.id, nickname: parsed.data.nickname } },
  });
  if (!member) return { error: "가입되지 않은 닉네임입니다" };
  if (!member.pinHash) {
    return { error: "아직 PIN이 없는 계정입니다. ‘가입’에서 초대코드로 PIN을 설정하세요." };
  }
  if (!verifyKey(parsed.data.pin, member.pinHash)) return { error: "PIN이 올바르지 않습니다" };

  await setMemberSession({ memberId: member.id, nickname: member.nickname, orgId: org.id });
  redirect(`/${slug}`);
}

// 시즌 리셋: 현재 순위 아카이브 → 잔액 초기화 → 진행중 마켓 무효 → 시즌+1
export async function resetSeason(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  const members = await prisma.member.findMany({
    where: { orgId: org.id },
    orderBy: { balance: "desc" },
  });

  await prisma.$transaction([
    // 직전 시즌 최종 순위 스냅샷
    ...members.map((m, i) =>
      prisma.seasonStanding.create({
        data: {
          orgId: org.id,
          season: org.season,
          nickname: m.nickname,
          balance: m.balance,
          rank: i + 1,
        },
      }),
    ),
    // 전원 잔액 초기화
    prisma.member.updateMany({
      where: { orgId: org.id },
      data: { balance: org.startingBalance },
    }),
    // 진행중(미정산) 마켓 무효 처리 + 베팅 환불 표시
    prisma.market.updateMany({
      where: { orgId: org.id, status: MarketStatus.OPEN },
      data: { status: MarketStatus.VOID },
    }),
    prisma.bet.updateMany({
      where: { market: { orgId: org.id }, status: BetStatus.ACTIVE },
      data: { status: BetStatus.REFUNDED },
    }),
    // 시즌 증가
    prisma.organization.update({
      where: { id: org.id },
      data: { season: { increment: 1 } },
    }),
  ]);

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/leaderboard`);
  revalidatePath(`/${slug}/admin`);
}
