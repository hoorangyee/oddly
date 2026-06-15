// 내부에서 쓰는 모든 시각은 KST(UTC+9, 서머타임 없음) 기준으로 표시·해석한다.
// 저장은 절대시각(epoch) 그대로 두고, 화면 표시와 입력 파싱 경계에서만 KST 로 변환한다.
// 서버(예: Vercel)는 UTC 로 동작하므로 실행 환경 TZ 에 의존하지 않도록 직접 오프셋을 적용한다.

export const KST_TIME_ZONE = "Asia/Seoul";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

// datetime-local 문자열("YYYY-MM-DDTHH:mm")을 KST 벽시계로 해석해 절대시각 Date 로 변환.
// 형식이 올바르지 않으면 null.
export function parseKstDateTimeLocal(input: string): Date | null {
  const m = DATETIME_LOCAL_RE.exec(input.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  // KST 벽시계 → UTC 절대시각: 같은 숫자를 UTC 로 본 값에서 9시간을 뺀다.
  const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, s ? +s : 0) - KST_OFFSET_MS;
  const date = new Date(ms);
  return isNaN(date.getTime()) ? null : date;
}

// 절대시각 Date 를 KST 벽시계 datetime-local 문자열("YYYY-MM-DDTHH:mm")로 변환.
// datetime-local input 의 기본값/표시용. 실행 환경 TZ 와 무관하게 동작한다.
export function toKstDateTimeLocal(d: Date): string {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}T${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}
