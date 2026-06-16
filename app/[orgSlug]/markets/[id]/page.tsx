import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getOrgBySlug,
  getMarketDetail,
  getCurrentMember,
  getMemberBetsForMarket,
  listCustomEmojis,
  isBettingClosed,
} from "@/lib/data";
import { isOrgAdmin } from "@/lib/auth";
import { Card, Badge, MarketStatusBadge } from "@/components/ui";
import { OddsBar } from "@/components/OddsBar";
import { BetForm } from "@/components/forms/BetForm";
import { CommentForm } from "@/components/forms/CommentForm";
import { OutcomeBettors } from "@/components/OutcomeBettors";
import { ReactionBar } from "@/components/ReactionBar";
import { ResolvePanel } from "@/components/ResolvePanel";
import { cancelBet } from "@/lib/actions/markets";
import { AutoRefresh } from "@/components/AutoRefresh";
import { MarketType, MarketStatus, BetStatus } from "@/lib/constants";
import { formatPoints, formatDateTime, closesInLabel } from "@/lib/format";
import { groupReactions, type ReactionListItem } from "@/lib/reactions";

const BET_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "대기", color: "blue" },
  WON: { label: "적중", color: "green" },
  LOST: { label: "미적중", color: "red" },
  REFUNDED: { label: "환불", color: "slate" },
};

export default async function MarketPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) notFound();
  const market = await getMarketDetail(org.id, id);
  if (!market) notFound();

  const [member, admin, customEmojis] = await Promise.all([
    getCurrentMember(org.id),
    isOrgAdmin(org.id),
    listCustomEmojis(org.id),
  ]);
  const closed = isBettingClosed(market);
  const resolved = market.status === MarketStatus.RESOLVED || market.status === MarketStatus.VOID;
  const winning = market.outcomes.find((o) => o.id === market.resolvedOutcomeId);
  const myBets = member ? await getMemberBetsForMarket(market.id, member.id) : [];
  const customEmojiOptions = customEmojis.map((emoji) => ({
    id: emoji.id,
    shortcode: emoji.shortcode,
    imageUrl: emoji.imageUrl,
  }));

  return (
    <div className="space-y-5">
      {!resolved && <AutoRefresh />}

      <Link href={`/${orgSlug}`} className="text-sm text-slate-500 hover:text-violet-700">
        ← 마켓 목록
      </Link>

      {/* 헤더 */}
      <Card className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold leading-snug text-slate-800">{market.title}</h1>
          <MarketStatusBadge status={market.status} closed={closed} />
        </div>
        {market.description && (
          <p className="whitespace-pre-wrap text-sm text-slate-600">{market.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <Badge color={market.type === MarketType.MULTI ? "violet" : "slate"}>
            {market.type === MarketType.MULTI ? "멀티초이스" : "예 / 아니오"}
          </Badge>
          <span>by {market.creator?.nickname ?? "탈퇴한 사용자"}</span>
          <span>마감 {formatDateTime(market.closesAt)}</span>
          {market.status === MarketStatus.OPEN && !closed && <span>· {closesInLabel(market.closesAt)}</span>}
        </div>
      </Card>

      {/* 확률 */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">현재 확률 · 배당</h2>
        <OddsBar outcomes={market.outcomes} resolvedOutcomeId={market.resolvedOutcomeId} />
      </Card>

      {/* 정산 결과 / 베팅 영역 */}
      {market.status === MarketStatus.VOID ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          무효 처리된 마켓입니다. 모든 베팅이 환불되었습니다.
        </Card>
      ) : market.status === MarketStatus.RESOLVED ? (
        <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          결과: <span className="font-semibold">{winning?.label ?? "—"}</span> 승리 · 정산 완료
        </Card>
      ) : !member ? (
        <Card className="p-4 text-center text-sm text-slate-600">
          베팅하려면{" "}
          <Link href={`/${orgSlug}/join`} className="font-medium text-violet-700 underline">
            참여하기
          </Link>
        </Card>
      ) : closed ? (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          마감되었습니다. 관리자의 결과 확정을 기다리는 중입니다.
        </Card>
      ) : (
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">베팅하기</h2>
          <BetForm
            orgId={org.id}
            orgSlug={orgSlug}
            marketId={market.id}
            outcomes={market.outcomes.map((o) => ({ id: o.id, label: o.label }))}
            balance={member.balance}
          />
        </Card>
      )}

      {/* 옵션별 베팅 현황 */}
      <OutcomeBettors
        orgSlug={orgSlug}
        marketId={market.id}
        outcomes={market.outcomes.map((o) => ({ id: o.id, label: o.label }))}
        bets={market.bets.map((b) => ({
          id: b.id,
          outcomeId: b.outcomeId,
          amount: b.amount,
          status: b.status,
          member: { nickname: b.member.nickname },
        }))}
        admin={admin}
        canVoid={!resolved}
      />

      {/* 내 베팅 */}
      {myBets.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">내 베팅</h2>
          <ul className="space-y-2">
            {myBets.map((b) => {
              const s = BET_STATUS[b.status] ?? BET_STATUS.ACTIVE;
              return (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {b.outcome.label} · {formatPoints(b.amount)}
                  </span>
                  <span className="flex items-center gap-2">
                    {b.payout != null && b.status !== BetStatus.LOST && (
                      <span className="tabular-nums text-emerald-700">+{formatPoints(b.payout)}</span>
                    )}
                    <Badge color={s.color}>{s.label}</Badge>
                    {!closed && b.status === BetStatus.ACTIVE && (
                      <form action={cancelBet}>
                        <input type="hidden" name="orgId" value={org.id} />
                        <input type="hidden" name="orgSlug" value={orgSlug} />
                        <input type="hidden" name="marketId" value={market.id} />
                        <input type="hidden" name="betId" value={b.id} />
                        <button
                          type="submit"
                          className="shrink-0 whitespace-nowrap text-xs text-slate-400 hover:text-rose-600 hover:underline"
                        >
                          취소
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* 관리자 정산 */}
      {admin && !resolved && (
        <ResolvePanel
          orgSlug={orgSlug}
          marketId={market.id}
          outcomes={market.outcomes.map((o) => ({ id: o.id, label: o.label }))}
        />
      )}

      {/* 반응 */}
      <ReactionBar
        orgId={org.id}
        orgSlug={orgSlug}
        target={{ type: "MARKET", id: market.id }}
        groupedReactions={groupReactions(toReactionItems(market.reactions), member?.id ?? null)}
        customEmojis={customEmojiOptions}
        canReact={member != null}
      />

      {/* 댓글 */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">댓글 {market.comments.length}</h2>
        <ul className="mb-4 space-y-3">
          {market.comments.length === 0 && (
            <li className="text-sm text-slate-400">첫 댓글을 남겨보세요.</li>
          )}
          {market.comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium text-slate-700">{c.member.nickname}</span>{" "}
              <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
              <p className="whitespace-pre-wrap text-slate-600">{c.body}</p>
              <ReactionBar
                orgId={org.id}
                orgSlug={orgSlug}
                target={{ type: "COMMENT", id: c.id }}
                groupedReactions={groupReactions(toReactionItems(c.reactions), member?.id ?? null)}
                customEmojis={customEmojiOptions}
                canReact={member != null}
                className="mt-2"
              />
            </li>
          ))}
        </ul>
        {member ? (
          <CommentForm orgId={org.id} orgSlug={orgSlug} marketId={market.id} />
        ) : (
          <p className="text-sm text-slate-400">
            댓글을 쓰려면{" "}
            <Link href={`/${orgSlug}/join`} className="text-violet-700 underline">
              참여
            </Link>
            하세요.
          </p>
        )}
      </Card>
    </div>
  );
}

function toReactionItems(
  reactions: {
    memberId: string;
    emoji: string | null;
    customEmoji: { id: string; shortcode: string; imageUrl: string } | null;
  }[],
): ReactionListItem[] {
  return reactions.map((reaction) => ({
    memberId: reaction.memberId,
    emoji: reaction.emoji,
    customEmoji: reaction.customEmoji,
  }));
}
