import { voidBet } from "@/lib/actions/markets";
import { formatPoints } from "@/lib/format";
import { BetStatus } from "@/lib/constants";
import { Card } from "./ui";

type Outcome = { id: string; label: string };
type Bet = {
  id: string;
  outcomeId: string;
  amount: number;
  status: string;
  member: { nickname: string };
};

// 옵션별 베팅자(이름+금액) 표시 — 전원 공개. 관리자에겐 ACTIVE 베팅 무효화 버튼 노출.
export function OutcomeBettors({
  orgSlug,
  marketId,
  outcomes,
  bets,
  admin,
  canVoid,
}: {
  orgSlug: string;
  marketId: string;
  outcomes: Outcome[];
  bets: Bet[];
  admin: boolean;
  canVoid: boolean;
}) {
  // 환불(무효화/무효 마켓)된 베팅은 스테이크가 반환됐으므로 제외
  const visible = bets.filter((b) => b.status !== BetStatus.REFUNDED);
  if (visible.length === 0) return null;

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-500">옵션별 베팅 현황</h2>
      <div className="space-y-4">
        {outcomes.map((o) => {
          const list = visible.filter((b) => b.outcomeId === o.id);
          return (
            <div key={o.id}>
              <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>{o.label}</span>
                <span className="text-xs text-slate-400">{list.length}명</span>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-slate-400">아직 없음</p>
              ) : (
                <ul className="space-y-1">
                  {list.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600">
                        {b.member.nickname} ·{" "}
                        <span className="tabular-nums">{formatPoints(b.amount)}</span>
                      </span>
                      {admin && canVoid && b.status === BetStatus.ACTIVE && (
                        <form action={voidBet}>
                          <input type="hidden" name="orgSlug" value={orgSlug} />
                          <input type="hidden" name="marketId" value={marketId} />
                          <input type="hidden" name="betId" value={b.id} />
                          <button
                            type="submit"
                            className="shrink-0 whitespace-nowrap text-xs text-rose-500 hover:text-rose-700 hover:underline"
                          >
                            무효화
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
