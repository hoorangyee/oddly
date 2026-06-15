import { resolveMarket, voidMarket } from "@/lib/actions/markets";
import { Card } from "./ui";

type Outcome = { id: string; label: string };

export function ResolvePanel({
  orgSlug,
  marketId,
  outcomes,
}: {
  orgSlug: string;
  marketId: string;
  outcomes: Outcome[];
}) {
  return (
    <Card className="border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-800">관리자 · 결과 확정</h3>
      <p className="mt-0.5 mb-3 text-xs text-amber-700">
        승리한 결과를 누르면 즉시 정산됩니다(되돌릴 수 없음).
      </p>
      <div className="flex flex-wrap gap-2">
        {outcomes.map((o) => (
          <form key={o.id} action={resolveMarket}>
            <input type="hidden" name="orgSlug" value={orgSlug} />
            <input type="hidden" name="marketId" value={marketId} />
            <input type="hidden" name="winningOutcomeId" value={o.id} />
            <button
              type="submit"
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              ✓ {o.label} 승리
            </button>
          </form>
        ))}
      </div>
      <form action={voidMarket} className="mt-3">
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <input type="hidden" name="marketId" value={marketId} />
        <button type="submit" className="text-xs text-rose-600 underline hover:text-rose-700">
          무효 처리 (전원 환불)
        </button>
      </form>
    </Card>
  );
}
