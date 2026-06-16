"use server";

import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { prisma } from "../db";
import { getMemberSession, isOrgAdmin } from "../auth";
import { commentSchema } from "../validation";
import {
  canDeleteCustomEmoji,
  normalizeCustomEmojiShortcode,
  shortcodeToEmojiId,
  validateCustomEmojiUpload,
} from "../custom-emojis";
import { isSupportedUnicodeEmoji } from "../reactions";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

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
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const emoji = String(formData.get("emoji") ?? "");
  const customEmojiId = String(formData.get("customEmojiId") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return;

  const target = await resolveReactionTarget(orgId, targetType, targetId);
  if (!target) return;

  const reactionValue = await resolveReactionValue(orgId, emoji, customEmojiId);
  if (!reactionValue) return;

  const targetWhere =
    target.type === "MARKET" ? { marketId: target.id } : { commentId: target.id };
  const valueWhere =
    reactionValue.kind === "unicode"
      ? { emoji: reactionValue.emoji }
      : { customEmojiId: reactionValue.customEmojiId };
  const existingWhere =
    target.type === "MARKET"
      ? reactionValue.kind === "unicode"
        ? {
            marketId_memberId_emoji: {
              marketId: target.id,
              memberId: session.memberId,
              emoji: reactionValue.emoji,
            },
          }
        : {
            marketId_memberId_customEmojiId: {
              marketId: target.id,
              memberId: session.memberId,
              customEmojiId: reactionValue.customEmojiId,
            },
          }
      : reactionValue.kind === "unicode"
        ? {
            commentId_memberId_emoji: {
              commentId: target.id,
              memberId: session.memberId,
              emoji: reactionValue.emoji,
            },
          }
        : {
            commentId_memberId_customEmojiId: {
              commentId: target.id,
              memberId: session.memberId,
              customEmojiId: reactionValue.customEmojiId,
            },
          };

  const existing = await prisma.reaction.findUnique({
    where: existingWhere,
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { ...targetWhere, ...valueWhere, memberId: session.memberId },
    });
  }
  revalidatePath(`/${slug}/markets/${target.marketId}`);
}

export async function createCustomEmoji(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const orgId = String(formData.get("orgId") ?? "");
  const slug = String(formData.get("orgSlug") ?? "");
  const revalidatePathname = String(formData.get("revalidatePathname") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return { error: "먼저 조직에 참여하세요" };

  let shortcode: string;
  let upload: ReturnType<typeof validateCustomEmojiUpload>;
  try {
    shortcode = normalizeCustomEmojiShortcode(String(formData.get("shortcode") ?? ""));
    const file = formData.get("image");
    if (!(file instanceof File)) return { error: "업로드할 이미지 파일을 선택하세요" };
    upload = validateCustomEmojiUpload(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "입력값을 확인하세요" };
  }

  const duplicate = await prisma.customEmoji.findUnique({
    where: { orgId_shortcode: { orgId, shortcode } },
    select: { id: true },
  });
  if (duplicate) return { error: "이미 같은 이름의 이모지가 있습니다" };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "Vercel Blob 토큰이 설정되어 있지 않습니다" };
  }

  const emojiId = shortcodeToEmojiId(shortcode);
  const pathname = `custom-emojis/${orgId}/${encodeURIComponent(emojiId)}-${nanoid(8)}.${upload.extension}`;
  let uploaded: { url: string; pathname: string } | null = null;

  try {
    const file = formData.get("image");
    if (!(file instanceof File)) return { error: "업로드할 이미지 파일을 선택하세요" };
    uploaded = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: upload.contentType,
    });

    await prisma.customEmoji.create({
      data: {
        orgId,
        creatorId: session.memberId,
        shortcode,
        imageUrl: uploaded.url,
        blobPathname: uploaded.pathname,
        contentType: upload.contentType,
        sizeBytes: file.size,
      },
    });
  } catch (error) {
    if (uploaded) {
      await del(uploaded.url).catch(() => undefined);
    }
    return {
      error: error instanceof Error ? error.message : "커스텀 이모지 업로드에 실패했습니다",
    };
  }

  revalidatePath(`/${slug}/emojis`);
  if (isSameOrgPath(revalidatePathname, slug)) {
    revalidatePath(revalidatePathname);
  }
  revalidatePath(`/${slug}`, "layout");
  return { ok: true, message: `${shortcode} 이모지를 추가했습니다` };
}

export async function deleteCustomEmoji(formData: FormData): Promise<void> {
  const orgId = String(formData.get("orgId") ?? "");
  const slug = String(formData.get("orgSlug") ?? "");
  const customEmojiId = String(formData.get("customEmojiId") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return;

  const customEmoji = await prisma.customEmoji.findFirst({
    where: { id: customEmojiId, orgId },
    select: { id: true, creatorId: true, imageUrl: true },
  });
  if (!customEmoji) return;

  const admin = await isOrgAdmin(orgId);
  if (!canDeleteCustomEmoji(customEmoji, session.memberId, admin)) return;

  await prisma.customEmoji.delete({ where: { id: customEmoji.id } });
  await del(customEmoji.imageUrl).catch(() => undefined);
  revalidatePath(`/${slug}/emojis`);
  revalidatePath(`/${slug}`, "layout");
}

type ResolvedReactionTarget =
  | { type: "MARKET"; id: string; marketId: string }
  | { type: "COMMENT"; id: string; marketId: string };

async function resolveReactionTarget(
  orgId: string,
  targetType: string,
  targetId: string,
): Promise<ResolvedReactionTarget | null> {
  if (targetType === "MARKET") {
    const market = await prisma.market.findFirst({
      where: { id: targetId, orgId },
      select: { id: true },
    });
    return market ? { type: "MARKET", id: market.id, marketId: market.id } : null;
  }

  if (targetType === "COMMENT") {
    const comment = await prisma.comment.findFirst({
      where: { id: targetId, market: { orgId } },
      select: { id: true, marketId: true },
    });
    return comment ? { type: "COMMENT", id: comment.id, marketId: comment.marketId } : null;
  }

  return null;
}

function isSameOrgPath(pathname: string, slug: string): boolean {
  return pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
}

async function resolveReactionValue(
  orgId: string,
  emoji: string,
  customEmojiId: string,
): Promise<
  | { kind: "unicode"; emoji: string }
  | { kind: "custom"; customEmojiId: string }
  | null
> {
  if (customEmojiId) {
    const customEmoji = await prisma.customEmoji.findFirst({
      where: { id: customEmojiId, orgId },
      select: { id: true },
    });
    return customEmoji ? { kind: "custom", customEmojiId: customEmoji.id } : null;
  }

  if (emoji && isSupportedUnicodeEmoji(emoji)) {
    return { kind: "unicode", emoji };
  }

  return null;
}
