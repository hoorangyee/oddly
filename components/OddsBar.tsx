import { computeOdds } from "@/lib/parimutuel";
import { formatPercent, formatMultiplier, formatPoints } from "@/lib/format";

type O = { id: string; label: string; poolTotal: number };

const BAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-pink-500",
];

export function OddsBar({
  outcomes,
  resolvedOutcomeId,
  compact = false,
}: {
  outcomes: O[];
  resolvedOutcomeId?: string | null;
  compact?: boolean;
}) {
  const odds = computeOdds(outcomes.map((o) => ({ outcomeId: o.id, poolTotal: o.poolTotal })));

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      {outcomes.map((o, i) => {
        const d = odds[o.id] ?? { prob: 0, multiplier: 0 };
        const pct = Math.round(d.prob * 100);
        const won = resolvedOutcomeId === o.id;
        return (
          <div key={o.id}>
            <div className="flex items-baseline justify-between text-sm">
              <span className={`font-medium ${won ? "text-emerald-700" : "text-slate-700"}`}>
                {won && "✓ "}
                {o.label}
              </span>
              <span className="tabular-nums text-slate-500">
                {formatPercent(d.prob)}
                {!compact && <span className="text-slate-400"> · {formatMultiplier(d.multiplier)}</span>}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            {!compact && (
              <div className="mt-0.5 text-xs text-slate-400">풀 {formatPoints(o.poolTotal)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
