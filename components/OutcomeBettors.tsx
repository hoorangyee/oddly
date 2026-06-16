import { voidMemberOutcomeBets } from "@/lib/actions/markets";
import { formatPoints } from "@/lib/format";
import { BetStatus } from "@/lib/constants";
import { Card } from "./ui";

type Outcome = { id: string; label: string };
type Bet = {
  id: string;
  outcomeId: string;
  memberId: string;
  amount: number;
  status: string;
  member: { nickname: string };
};

type MemberGroup = { memberId: string; nickname: string; total: number; activeCount: number };

// 옵션별 베팅자(이름+금액) 표시 — 전원 공개. 동일 멤버의 베팅은 합산해 한 줄로.
// 관리자에겐 ACTIVE 베팅이 있는 멤버에 한해 무효화 버튼 노출(해당 옵션 ACTIVE 베팅 일괄).
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
          // 동일 멤버의 베팅을 합산
          const byMember = new Map<string, MemberGroup>();
          for (const b of visible) {
            if (b.outcomeId !== o.id) continue;
            const g =
              byMember.get(b.memberId) ??
              { memberId: b.memberId, nickname: b.member.nickname, total: 0, activeCount: 0 };
            g.total += b.amount;
            if (b.status === BetStatus.ACTIVE) g.activeCount += 1;
            byMember.set(b.memberId, g);
          }
          const groups = [...byMember.values()].sort((a, b) => b.total - a.total);
          return (
            <div key={o.id}>
              <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>{o.label}</span>
                <span className="text-xs text-slate-400">{groups.length}명</span>
              </div>
              {groups.length === 0 ? (
                <p className="text-xs text-slate-400">아직 없음</p>
              ) : (
                <ul className="space-y-1">
                  {groups.map((g) => (
                    <li key={g.memberId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600">
                        {g.nickname} ·{" "}
                        <span className="tabular-nums">{formatPoints(g.total)}</span>
                      </span>
                      {admin && canVoid && g.activeCount > 0 && (
                        <form action={voidMemberOutcomeBets}>
                          <input type="hidden" name="orgSlug" value={orgSlug} />
                          <input type="hidden" name="marketId" value={marketId} />
                          <input type="hidden" name="memberId" value={g.memberId} />
                          <input type="hidden" name="outcomeId" value={o.id} />
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
