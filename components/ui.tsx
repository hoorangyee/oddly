import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500";

export const labelClass = "block text-sm font-medium text-slate-600 mb-1";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-rose-600">{message}</p>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
};

export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?: keyof typeof BADGE_COLORS | string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        BADGE_COLORS[color] ?? BADGE_COLORS.slate
      }`}
    >
      {children}
    </span>
  );
}

// 마켓 상태 → 뱃지 표시
export function MarketStatusBadge({
  status,
  closed,
}: {
  status: string;
  closed: boolean;
}) {
  if (status === "RESOLVED") return <Badge color="green">정산 완료</Badge>;
  if (status === "VOID") return <Badge color="red">무효</Badge>;
  if (closed) return <Badge color="amber">마감(정산 대기)</Badge>;
  return <Badge color="blue">진행중</Badge>;
}
