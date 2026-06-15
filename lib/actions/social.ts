"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { getMemberSession } from "../auth";
import { commentSchema } from "../validation";
import { REACTION_EMOJIS } from "../constants";

export type ActionState = { ok?: boolean; error?: string } | null;

export async function addComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orgId = String(formData.get("orgId") ?? "");
  const slug = String(formData.get("orgSlug") ?? "");
  const marketId = String(formData.get("marketId") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return { error: "먼저 조직에 참여하세요" };

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };

  // 마켓이 이 조직 소속인지 확인
  const market = await prisma.market.findFirst({ where: { id: marketId, orgId }, select: { id: true } });
  if (!market) return { error: "마켓을 찾을 수 없습니다" };

  await prisma.comment.create({
    data: { marketId, memberId: session.memberId, body: parsed.data.body },
  });
  revalidatePath(`/${slug}/markets/${marketId}`);
  return { ok: true };
}

// 같은 이모지를 다시 누르면 토글(제거)
export async function toggleReaction(formData: FormData): Promise<void> {
  const orgId = String(formData.get("orgId") ?? "");
  const slug = String(formData.get("orgSlug") ?? "");
  const marketId = String(formData.get("marketId") ?? "");
  const emoji = String(formData.get("emoji") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return;
  if (!REACTION_EMOJIS.includes(emoji as (typeof REACTION_EMOJIS)[number])) return;

  const market = await prisma.market.findFirst({ where: { id: marketId, orgId }, select: { id: true } });
  if (!market) return;

  const existing = await prisma.reaction.findUnique({
    where: { marketId_memberId_emoji: { marketId, memberId: session.memberId, emoji } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { marketId, memberId: session.memberId, emoji } });
  }
  revalidatePath(`/${slug}/markets/${marketId}`);
}
