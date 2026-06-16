import Link from "next/link";
import { Card, MarketStatusBadge, Badge } from "./ui";
import { OddsBar } from "./OddsBar";
import { closesInLabel, formatPoints } from "@/lib/format";
import { MarketType } from "@/lib/constants";

type MarketCardData = {
  id: string;
  title: string;
  type: string;
  status: string;
  closesAt: Date;
  resolvedOutcomeId: string | null;
  creator: { nickname: string } | null;
  outcomes: { id: string; label: string; poolTotal: number }[];
  _count: { bets: number; comments: number };
};

export function MarketCard({ orgSlug, market }: { orgSlug: string; market: MarketCardData }) {
  const closed = market.status !== "OPEN" || market.closesAt.getTime() <= Date.now();
  const totalPool = market.outcomes.reduce((s, o) => s + o.poolTotal, 0);

  return (
    <Link href={`/${orgSlug}/markets/${market.id}`} className="block">
      <Card className="p-4 transition hover:border-violet-300 hover:shadow-md">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug text-slate-800">{market.title}</h3>
          <MarketStatusBadge status={market.status} closed={closed} />
        </div>

        <OddsBar outcomes={market.outcomes} resolvedOutcomeId={market.resolvedOutcomeId} compact />

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <Badge color={market.type === MarketType.MULTI ? "violet" : "slate"}>
            {market.type === MarketType.MULTI ? "멀티초이스" : "예 / 아니오"}
          </Badge>
          <span>총 풀 {formatPoints(totalPool)}</span>
          <span>베팅 {market._count.bets}</span>
          <span>💬 {market._count.comments}</span>
          <span className="ml-auto">
            {market.status === "OPEN" ? closesInLabel(market.closesAt) : `by ${market.creator?.nickname ?? "탈퇴한 사용자"}`}
          </span>
        </div>
      </Card>
    </Link>
  );
}
