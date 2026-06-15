// 순수 키/코드 유틸 (node:crypto, nanoid). next/headers 비의존 → seed 스크립트에서도 사용 가능.
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { customAlphabet } from "nanoid";

// 조직 adminKey 를 salt:hash 형태로 저장
export function hashKey(key: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(key, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyKey(key: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(key, salt, 64);
  const hashBuf = Buffer.from(hash, "hex");
  return hashBuf.length === test.length && timingSafeEqual(hashBuf, test);
}

// 사람이 읽기 쉬운 대문자+숫자 코드(혼동 문자 제외)
const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
export function newInviteCode(): string {
  return code();
}

// 조직 관리자 키(생성 시 1회 노출). 길고 추측 불가하게.
const keyAlpha = customAlphabet("abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", 24);
export function newAdminKey(): string {
  return `polly_admin_${keyAlpha()}`;
}
