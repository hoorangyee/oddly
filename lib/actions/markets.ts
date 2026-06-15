"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { getMemberSession, isOrgAdmin } from "../auth";
import { getOrgBySlug, isBettingClosed } from "../data";
import { createMarketSchema, placeBetSchema } from "../validation";
import { MarketType, MarketStatus, BetStatus } from "../constants";
import { settleMarket } from "../parimutuel";

export type ActionState = { ok?: boolean; error?: string } | null;

// ── 마켓 생성 (멤버 누구나) ────────────────────────────────────────
export async function createMarket(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orgId = String(formData.get("orgId") ?? "");
  const slug = String(formData.get("orgSlug") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return { error: "먼저 조직에 참여하세요" };

  const type = String(formData.get("type") ?? MarketType.BINARY);
  const outcomes =
    type === MarketType.MULTI
      ? String(formData.get("outcomesText") ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

  const parsed = createMarketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    type,
    closesAt: formData.get("closesAt"),
    outcomes,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };

  const outcomeData =
    parsed.data.type === MarketType.BINARY
      ? [
          { label: "예", sortOrder: 0 },
          { label: "아니오", sortOrder: 1 },
        ]
      : parsed.data.outcomes!.map((label, i) => ({ label, sortOrder: i }));

  const market = await prisma.market.create({
    data: {
      orgId,
      creatorId: session.memberId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      status: MarketStatus.OPEN,
      closesAt: parsed.data.closesAt,
      outcomes: { create: outcomeData },
    },
  });

  revalidatePath(`/${slug}`);
  redirect(`/${slug}/markets/${market.id}`);
}

// ── 베팅 (멤버) ────────────────────────────────────────────────────
export async function placeBet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orgId = String(formData.get("orgId") ?? "");
  const slug = String(formData.get("orgSlug") ?? "");
  const marketId = String(formData.get("marketId") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return { error: "먼저 조직에 참여하세요" };

  const parsed = placeBetSchema.safeParse({
    outcomeId: formData.get("outcomeId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };
  const { outcomeId, amount } = parsed.data;

  const market = await prisma.market.findFirst({
    where: { id: marketId, orgId },
    include: { outcomes: { select: { id: true } } },
  });
  if (!market) return { error: "마켓을 찾을 수 없습니다" };
  if (isBettingClosed(market)) return { error: "마감된 마켓입니다" };
  if (!market.outcomes.some((o) => o.id === outcomeId)) return { error: "잘못된 선택지입니다" };

  try {
    await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: session.memberId } });
      if (!member) throw new Error("멤버를 찾을 수 없습니다");
      if (member.balance < amount) throw new Error("보유 점수가 부족합니다");
      await tx.member.update({
        where: { id: member.id },
        data: { balance: { decrement: amount } },
      });
      await tx.outcome.update({ where: { id: outcomeId }, data: { poolTotal: { increment: amount } } });
      await tx.bet.create({
        data: { marketId, outcomeId, memberId: member.id, amount, status: BetStatus.ACTIVE },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "베팅에 실패했습니다" };
  }

  revalidatePath(`/${slug}/markets/${marketId}`);
  revalidatePath(`/${slug}/leaderboard`);
  return { ok: true };
}

// ── 결과 확정 (조직 관리자) ────────────────────────────────────────
export async function resolveMarket(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const marketId = String(formData.get("marketId") ?? "");
  const winningOutcomeId = String(formData.get("winningOutcomeId") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  const market = await prisma.market.findFirst({
    where: { id: marketId, orgId: org.id },
    include: { bets: true, outcomes: { select: { id: true } } },
  });
  if (!market) throw new Error("마켓을 찾을 수 없습니다");
  if (market.status === MarketStatus.RESOLVED || market.status === MarketStatus.VOID) return; // 멱등
  if (!market.outcomes.some((o) => o.id === winningOutcomeId)) throw new Error("잘못된 선택지");

  const settlement = settleMarket(
    market.bets.map((b) => ({ id: b.id, memberId: b.memberId, outcomeId: b.outcomeId, amount: b.amount })),
    winningOutcomeId,
  );

  const ops = [];
  for (const p of settlement.payouts) {
    ops.push(prisma.bet.update({ where: { id: p.betId }, data: { status: p.status, payout: p.payout } }));
    if (p.payout > 0) {
      ops.push(prisma.member.update({ where: { id: p.memberId }, data: { balance: { increment: p.payout } } }));
    }
  }
  ops.push(
    prisma.market.update({
      where: { id: marketId },
      data: {
        status: settlement.voided ? MarketStatus.VOID : MarketStatus.RESOLVED,
        resolvedOutcomeId: winningOutcomeId,
        resolvedAt: new Date(),
      },
    }),
  );
  await prisma.$transaction(ops);

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/markets/${marketId}`);
  revalidatePath(`/${slug}/leaderboard`);
}

// ── 무효 처리 (조직 관리자): 전원 환불 ─────────────────────────────
export async function voidMarket(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const marketId = String(formData.get("marketId") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  const market = await prisma.market.findFirst({
    where: { id: marketId, orgId: org.id },
    include: { bets: true },
  });
  if (!market) throw new Error("마켓을 찾을 수 없습니다");
  if (market.status === MarketStatus.RESOLVED || market.status === MarketStatus.VOID) return;

  const active = market.bets.filter((b) => b.status === BetStatus.ACTIVE);
  const ops = [];
  for (const b of active) {
    ops.push(prisma.bet.update({ where: { id: b.id }, data: { status: BetStatus.REFUNDED, payout: b.amount } }));
    ops.push(prisma.member.update({ where: { id: b.memberId }, data: { balance: { increment: b.amount } } }));
  }
  ops.push(
    prisma.market.update({
      where: { id: marketId },
      data: { status: MarketStatus.VOID, resolvedAt: new Date() },
    }),
  );
  await prisma.$transaction(ops);

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/markets/${marketId}`);
  revalidatePath(`/${slug}/leaderboard`);
}
