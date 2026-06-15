"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { getOrgBySlug } from "../data";
import { getMemberSession, isOrgAdmin } from "../auth";
import { inquirySchema, inquiryReplySchema } from "../validation";
import { InquiryStatus } from "../constants";

export type ActionState = { ok?: boolean; error?: string } | null;

// ── 문의 작성 (멤버) ───────────────────────────────────────────────
export async function createInquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orgId = String(formData.get("orgId") ?? "");
  const slug = String(formData.get("orgSlug") ?? "");
  const session = await getMemberSession(orgId);
  if (!session) return { error: "먼저 조직에 참여하세요" };

  const parsed = inquirySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요" };

  await prisma.inquiry.create({
    data: { orgId, memberId: session.memberId, body: parsed.data.body },
  });
  revalidatePath(`/${slug}/contact`);
  return { ok: true };
}

// ── 문의 답변 (조직 관리자) — 답변 시 자동 해결 처리 ───────────────
export async function replyInquiry(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  const parsed = inquiryReplySchema.safeParse({ reply: formData.get("reply") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "입력값을 확인하세요");

  await prisma.inquiry.updateMany({
    where: { id: inquiryId, orgId: org.id },
    data: { reply: parsed.data.reply, repliedAt: new Date(), status: InquiryStatus.RESOLVED },
  });
  revalidatePath(`/${slug}/contact`);
}

// ── 해결/미해결 토글 (조직 관리자) ─────────────────────────────────
export async function toggleInquiryStatus(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, orgId: org.id },
    select: { status: true },
  });
  if (!inquiry) throw new Error("문의를 찾을 수 없습니다");

  const next =
    inquiry.status === InquiryStatus.RESOLVED ? InquiryStatus.OPEN : InquiryStatus.RESOLVED;
  await prisma.inquiry.update({ where: { id: inquiryId }, data: { status: next } });
  revalidatePath(`/${slug}/contact`);
}

// ── 문의 삭제 (조직 관리자) ────────────────────────────────────────
export async function deleteInquiry(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const inquiryId = String(formData.get("inquiryId") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) throw new Error("조직을 찾을 수 없습니다");
  if (!(await isOrgAdmin(org.id))) throw new Error("권한이 없습니다");

  await prisma.inquiry.deleteMany({ where: { id: inquiryId, orgId: org.id } });
  revalidatePath(`/${slug}/contact`);
}
