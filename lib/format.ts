export function formatPoints(n: number): string {
  return n.toLocaleString("ko-KR") + "P";
}

// p: 0..1
export function formatPercent(p: number): string {
  return Math.round(p * 100) + "%";
}

export function formatMultiplier(m: number): string {
  if (!isFinite(m) || m <= 0) return "—";
  return "×" + m.toFixed(2);
}

export function closesInLabel(closesAt: Date): string {
  const ms = closesAt.getTime() - Date.now();
  if (ms <= 0) return "마감됨";
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}분 후 마감`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 후 마감`;
  const d = Math.floor(hr / 24);
  return `${d}일 후 마감`;
}

export function formatDateTime(d: Date): string {
  return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}
