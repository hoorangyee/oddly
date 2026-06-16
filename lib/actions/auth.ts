"use server";

import { redirect } from "next/navigation";
import { getOrgBySlug } from "../data";
import { verifyKey } from "../keys";
import {
  verifySuperKey,
  setSuperSession,
  clearSuperSession,
  setOrgAdminSession,
  clearOrgAdminSession,
  clearMemberSession,
} from "../auth";

export type FormState = { error?: string } | null;

export async function superLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const key = String(formData.get("key") ?? "");
  if (!verifySuperKey(key)) return { error: "슈퍼관리자 키가 올바르지 않습니다" };
  await setSuperSession();
  redirect("/admin");
}

export async function superLogout(): Promise<void> {
  await clearSuperSession();
  redirect("/admin");
}

export async function orgAdminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const slug = String(formData.get("orgSlug") ?? "");
  const key = String(formData.get("adminKey") ?? "");
  const org = await getOrgBySlug(slug);
  if (!org) return { error: "조직을 찾을 수 없습니다" };
  if (!verifyKey(key, org.adminKeyHash)) return { error: "관리자 키가 올바르지 않습니다" };
  await setOrgAdminSession(org.id);
  redirect(`/${slug}/admin`);
}

export async function orgAdminLogout(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const org = await getOrgBySlug(slug);
  if (org) await clearOrgAdminSession(org.id);
  redirect(`/${slug}`);
}

export async function memberLogout(formData: FormData): Promise<void> {
  const slug = String(formData.get("orgSlug") ?? "");
  const org = await getOrgBySlug(slug);
  if (org) await clearMemberSession(org.id);
  redirect(`/${slug}/login`);
}
