"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { getOrgBySlug } from "../data";
import { isOrgAdmin } from "../auth";
import { adjustPointsSchema, announcementSchema, ADJUST_ALL } from "../validation";
import { BetStatus } from "../constants";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

// ── 포인트 조정 (조직 관리자): 특정/전체 멤버에 지급(+)/차감(−) ──────
export async function adjustPoints(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = String(formData.get("orgSlug") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) return { error: "조직을 찾을 수 없습니다" };
  if (!(await isOrgAdmin(org.id))) return { error: "권한이 없습니다" };

  const parsed = adjustPointsSchema.safeParse({
    target: formData.get("target"),
    amount: formData.get("amount"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };
  const { target, amount, reason } = parsed.data;

  const members =
    target === ADJUST_ALL
      ? await prisma.member.findMany({ where: { orgId: org.id }, select: { id: true, balance: true } })
      : await prisma.member.findMany({
          where: { orgId: org.id, id: target },
          select: { id: true, balance: true },
        });
  if (members.length === 0) return { error: "대상 멤버가 없습니다" };

  // 차감 시 잔액 0 미만 방지: 보유 점수 한도로만 차감하고, 실제 적용액을 로그에 기록
  const ops = members.flatMap((m) => {
    const applied = amount < 0 ? -Math.min(-amount, m.balance) : amount;
    if (applied === 0) return [];
    return [
      prisma.member.update({ where: { id: m.id }, data: { balance: { increment: applied } } }),
      prisma.pointAdjustment.create({ data: { orgId: org.id, memberId: m.id, amount: applied, reason } }),
    ];
  });
  await prisma.$transaction(ops);

  revalidatePath(`/${slug}/admin`);
  revalidatePath(`/${slug}/leaderboard`);
  const verb = amount > 0 ? "지급" : "차감";
  const who = target === ADJUST_ALL ? `전체 ${members.length}명` : "멤버";
  return { ok: true, message: `${who}에게 ${Math.abs(amount).toLocaleString()}P ${verb} 완료` };
}

// ── 공지사항 작성 (조직 관리자) ────────────────────────────────────
export async function createAnnouncement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = String(formData.get("orgSlug") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) return { error: "조직을 찾을 수 없습니다" };
  if (!(await isOrgAdmin(org.id))) return { error: "권한이 없습니다" };

  const parsed = announcementSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };

  await prisma.announcement.create({ data: { orgId: org.id, body: parsed.data.body } });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
  return { ok: true };
}

// ── 멤버 삭제 (조직 관리자) ────────────────────────────────────────
// ACTIVE 베팅 스테이크를 풀에서 차감해 잔여 베팅자 정합성을 유지한 뒤 멤버 삭제.
// 삭제 시 베팅·댓글·반응·문의·포인트로그는 cascade 삭제, 생성한 마켓은 creatorId=null 로 보존.
export async function deleteMember(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  const member = await prisma.member.findFirst({
    where: { id: memberId, orgId: org.id },
    include: { bets: { where: { status: BetStatus.ACTIVE }, select: { outcomeId: true, amount: true } } },
  });
  if (!member) throw new Error("멤버를 찾을 수 없습니다");

  const ops = [];
  for (const b of member.bets) {
    ops.push(
      prisma.outcome.update({
        where: { id: b.outcomeId },
        data: { poolTotal: { decrement: b.amount } },
      }),
    );
  }
  ops.push(prisma.member.delete({ where: { id: member.id } }));
  await prisma.$transaction(ops);

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
  revalidatePath(`/${slug}/leaderboard`);
}

// ── 공지사항 삭제 (조직 관리자) ────────────────────────────────────
export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const id = String(formData.get("announcementId") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  await prisma.announcement.deleteMany({ where: { id, orgId: org.id } });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}
