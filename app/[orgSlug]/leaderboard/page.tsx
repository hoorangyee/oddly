import { getOrgBySlug, getLeaderboard, getPastStandings, getCurrentMember } from "@/lib/data";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Card } from "@/components/ui";
import { formatPoints } from "@/lib/format";

const MEDALS = ["🥇", "🥈", "🥉"];

function pct(v: number | null) {
  return v == null ? "—" : Math.round(v * 100) + "%";
}
function roiLabel(v: number | null) {
  if (v == null) return "—";
  const p = Math.round(v * 100);
  return (p >= 0 ? "+" : "") + p + "%";
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) return null;

  const [rows, past, member] = await Promise.all([
    getLeaderboard(org.id),
    getPastStandings(org.id),
    getCurrentMember(org.id),
  ]);

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <h1 className="text-xl font-bold text-slate-800">리더보드 · 시즌 {org.season}</h1>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">닉네임</th>
              <th className="px-4 py-2 text-right font-medium">보유 점수</th>
              <th className="px-4 py-2 text-right font-medium">적중률</th>
              <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">수익률</th>
              <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">베팅</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isMe = member?.id === r.memberId;
              return (
                <tr
                  key={r.memberId}
                  className={`border-b border-slate-50 last:border-0 ${
                    isMe ? "bg-violet-50" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 text-slate-500">{MEDALS[i] ?? i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    {r.nickname}
                    {isMe && <span className="ml-1 text-xs text-violet-600">(나)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-violet-700">
                    {formatPoints(r.balance)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                    {pct(r.winRate)}
                    {r.settled > 0 && <span className="text-slate-300"> ({r.wins}/{r.settled})</span>}
                  </td>
                  <td className="hidden px-4 py-2.5 text-right tabular-nums text-slate-500 sm:table-cell">
                    {roiLabel(r.roi)}
                  </td>
                  <td className="hidden px-4 py-2.5 text-right tabular-nums text-slate-500 sm:table-cell">
                    {r.bets}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  아직 참여자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500">지난 시즌</h2>
          {past.map(({ season, standings }) => (
            <Card key={season} className="p-4">
              <div className="mb-2 text-sm font-medium text-slate-600">시즌 {season}</div>
              <ol className="space-y-1 text-sm">
                {standings.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex justify-between text-slate-600">
                    <span>
                      {MEDALS[s.rank - 1] ?? s.rank} {s.nickname}
                    </span>
                    <span className="tabular-nums">{formatPoints(s.balance)}</span>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
