import Link from "next/link";
import { Card, MarketStatusBadge, Badge } from "./ui";
import { OddsBar } from "./OddsBar";
import { closesInLabel, formatPoints } from "@/lib/format";
import { MarketType } from "@/lib/constants";
import { getTopReactionGroups, type GroupedReaction, type ReactionListItem } from "@/lib/reactions";

type MarketCardData = {
  id: string;
  title: string;
  type: string;
  status: string;
  closesAt: Date;
  closed: boolean;
  resolvedOutcomeId: string | null;
  creator: { nickname: string };
  outcomes: { id: string; label: string; poolTotal: number }[];
  reactions: ReactionListItem[];
  _count: { bets: number; comments: number };
};

export function MarketCard({ orgSlug, market }: { orgSlug: string; market: MarketCardData }) {
  const totalPool = market.outcomes.reduce((s, o) => s + o.poolTotal, 0);
  const reactionPreview = getTopReactionGroups(market.reactions, 3);

  return (
    <Link href={`/${orgSlug}/markets/${market.id}`} className="block">
      <Card className="p-4 transition hover:border-violet-300 hover:shadow-md">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug text-slate-800">{market.title}</h3>
          <MarketStatusBadge status={market.status} closed={market.closed} />
        </div>

        <OddsBar outcomes={market.outcomes} resolvedOutcomeId={market.resolvedOutcomeId} compact />

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <Badge color={market.type === MarketType.MULTI ? "violet" : "slate"}>
            {market.type === MarketType.MULTI ? "멀티초이스" : "예 / 아니오"}
          </Badge>
          <span>총 풀 {formatPoints(totalPool)}</span>
          <span>베팅 {market._count.bets}</span>
          <span>💬 {market._count.comments}</span>
          <ReactionPreview reactions={reactionPreview} />
          <span className="ml-auto">
            {market.status === "OPEN" ? closesInLabel(market.closesAt) : `by ${market.creator.nickname}`}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function ReactionPreview({ reactions }: { reactions: GroupedReaction[] }) {
  if (reactions.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1" aria-label="마켓 반응 미리보기">
      {reactions.map((reaction) => (
        <span
          key={reaction.key}
          className="inline-flex h-5 items-center gap-0.5 rounded-full bg-slate-100 px-1.5 text-[11px] leading-none text-slate-600"
          title={`${reaction.label} ${reaction.count}`}
        >
          {reaction.kind === "custom" ? (
            // eslint-disable-next-line @next/next/no-img-element -- Custom emoji URLs are user-uploaded Blob URLs.
            <img
              src={reaction.customEmoji.imageUrl}
              alt={reaction.customEmoji.shortcode}
              className="h-3.5 w-3.5 rounded-sm object-contain"
            />
          ) : (
            <span className="text-[13px] leading-none">{reaction.emoji}</span>
          )}
          <span className="tabular-nums">{reaction.count}</span>
        </span>
      ))}
    </span>
  );
}
