import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "node:crypto";

// ── JWT 서명/검증 (HS256, SESSION_SECRET) ──────────────────────────
function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

async function sign(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secretKey());
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as T;
  } catch {
    return null;
  }
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 90, // 90일
};

// ── 멤버 세션 (조직별 쿠키) ────────────────────────────────────────
export type MemberSession = { memberId: string; nickname: string; orgId: string };

const memberCookie = (orgId: string) => `polly_m_${orgId}`;

export async function setMemberSession(s: MemberSession): Promise<void> {
  const token = await sign({ ...s });
  (await cookies()).set(memberCookie(s.orgId), token, COOKIE_OPTS);
}

export async function getMemberSession(orgId: string): Promise<MemberSession | null> {
  const token = (await cookies()).get(memberCookie(orgId))?.value;
  const payload = await verify<MemberSession>(token);
  if (!payload || payload.orgId !== orgId) return null;
  return payload;
}

export async function clearMemberSession(orgId: string): Promise<void> {
  (await cookies()).delete(memberCookie(orgId));
}

// ── 조직 관리자 세션 (조직별 쿠키) ─────────────────────────────────
const adminCookie = (orgId: string) => `polly_a_${orgId}`;

export async function setOrgAdminSession(orgId: string): Promise<void> {
  const token = await sign({ orgId, role: "org-admin" });
  (await cookies()).set(adminCookie(orgId), token, COOKIE_OPTS);
}

export async function isOrgAdmin(orgId: string): Promise<boolean> {
  const token = (await cookies()).get(adminCookie(orgId))?.value;
  const payload = await verify<{ orgId: string; role: string }>(token);
  return !!payload && payload.orgId === orgId && payload.role === "org-admin";
}

export async function clearOrgAdminSession(orgId: string): Promise<void> {
  (await cookies()).delete(adminCookie(orgId));
}

// ── 슈퍼관리자 세션 (env 키 기반) ──────────────────────────────────
const SUPER_COOKIE = "polly_super";

export function verifySuperKey(key: string): boolean {
  const expected = process.env.SUPER_ADMIN_KEY;
  if (!expected) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setSuperSession(): Promise<void> {
  const token = await sign({ role: "super-admin" });
  (await cookies()).set(SUPER_COOKIE, token, COOKIE_OPTS);
}

export async function isSuperAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SUPER_COOKIE)?.value;
  const payload = await verify<{ role: string }>(token);
  return !!payload && payload.role === "super-admin";
}

export async function clearSuperSession(): Promise<void> {
  (await cookies()).delete(SUPER_COOKIE);
}
