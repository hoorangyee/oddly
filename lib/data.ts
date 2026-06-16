// 읽기 전용 쿼리 헬퍼. 서버 컴포넌트에서 호출.
import { prisma } from "./db";
import { getMemberSession } from "./auth";
import { BetStatus, MarketStatus } from "./constants";

// 현재 쿠키 세션에 해당하는 멤버(잔액 포함). 없으면 null.
export async function getCurrentMember(orgId: string) {
  const session = await getMemberSession(orgId);
  if (!session) return null;
  return prisma.member.findUnique({ where: { id: session.memberId } });
}

export async function getOrgBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function getOrgById(id: string) {
  return prisma.organization.findUnique({ where: { id } });
}

// 마켓이 실질적으로 마감됐는지(베팅 불가) — 상태가 OPEN 이라도 마감시각 경과면 true
export function isBettingClosed(market: { status: string; closesAt: Date }): boolean {
  if (market.status !== MarketStatus.OPEN) return true;
  return market.closesAt.getTime() <= Date.now();
}

export async function listMarkets(orgId: string) {
  const markets = await prisma.market.findMany({
    where: { orgId },
    include: {
      outcomes: { orderBy: { sortOrder: "asc" } },
      creator: { select: { nickname: true } },
      reactions: {
        select: {
          memberId: true,
          emoji: true,
          customEmoji: { select: { id: true, shortcode: true, imageUrl: true } },
        },
      },
      _count: { select: { bets: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const marketsWithClosedState = markets.map((market) => ({
    ...market,
    closed: isBettingClosed(market),
  }));

  // 진행중(OPEN & 마감 전) 먼저, 그다음 마감/정산
  return marketsWithClosedState.sort((a, b) => {
    const aOpen = !a.closed;
    const bOpen = !b.closed;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function getMarketDetail(orgId: string, marketId: string) {
  const market = await prisma.market.findFirst({
    where: { id: marketId, orgId },
    include: {
      outcomes: { orderBy: { sortOrder: "asc" } },
      creator: { select: { nickname: true } },
      comments: {
        include: {
          member: { select: { nickname: true } },
          reactions: {
            include: {
              customEmoji: { select: { id: true, shortcode: true, imageUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: {
        include: {
          member: { select: { nickname: true } },
          customEmoji: { select: { id: true, shortcode: true, imageUrl: true } },
        },
      },
      bets: {
        include: { member: { select: { nickname: true } } },
        orderBy: { amount: "desc" },
      },
    },
  });
  return market;
}

// 특정 마켓에서 한 멤버의 베팅 목록
export async function getMemberBetsForMarket(marketId: string, memberId: string) {
  return prisma.bet.findMany({
    where: { marketId, memberId },
    include: { outcome: { select: { label: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export type LeaderboardRow = {
  memberId: string;
  nickname: string;
  balance: number;
  bets: number;
  settled: number;
  wins: number;
  winRate: number | null; // 적중률 (정산된 베팅 기준)
  roi: number | null; // 수익률 (정산된 스테이크 대비 순손익)
};

export async function getLeaderboard(orgId: string): Promise<LeaderboardRow[]> {
  const members = await prisma.member.findMany({
    where: { orgId },
    include: { bets: { select: { amount: true, status: true, payout: true } } },
  });

  const rows: LeaderboardRow[] = members.map((m) => {
    const settledBets = m.bets.filter(
      (b) => b.status === BetStatus.WON || b.status === BetStatus.LOST,
    );
    const wins = settledBets.filter((b) => b.status === BetStatus.WON).length;
    const staked = settledBets.reduce((s, b) => s + b.amount, 0);
    const returned = settledBets.reduce((s, b) => s + (b.payout ?? 0), 0);
    return {
      memberId: m.id,
      nickname: m.nickname,
      balance: m.balance,
      bets: m.bets.length,
      settled: settledBets.length,
      wins,
      winRate: settledBets.length ? wins / settledBets.length : null,
      roi: staked ? (returned - staked) / staked : null,
    };
  });

  return rows.sort((a, b) => b.balance - a.balance || a.nickname.localeCompare(b.nickname));
}

// 조직 멤버 목록(잔액·PIN 설정여부 포함) — 관리자 포인트 조정/멤버 관리용
export async function listMembers(orgId: string) {
  return prisma.member.findMany({
    where: { orgId },
    select: { id: true, nickname: true, balance: true, pinHash: true },
    orderBy: { nickname: "asc" },
  });
}

// 조직 공지사항 — 최신순. 마켓 목록 상단 배너 / 관리자 페이지 공용.
export async function listAnnouncements(orgId: string) {
  return prisma.announcement.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listCustomEmojis(orgId: string) {
  return prisma.customEmoji.findMany({
    where: { orgId },
    include: { creator: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// 최근 포인트 조정 로그 — 관리자 페이지 표시용
export async function listPointAdjustments(orgId: string, limit = 20) {
  return prisma.pointAdjustment.findMany({
    where: { orgId },
    include: { member: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// 멤버 본인의 문의 목록(답변 포함) — 최신순
export async function listInquiriesForMember(orgId: string, memberId: string) {
  return prisma.inquiry.findMany({
    where: { orgId, memberId },
    orderBy: { createdAt: "desc" },
  });
}

// 조직 전체 문의 목록(관리자용) — 미해결 먼저, 그다음 최신순
export async function listInquiries(orgId: string) {
  const rows = await prisma.inquiry.findMany({
    where: { orgId },
    include: { member: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.sort((a, b) => {
    const aOpen = a.status === "OPEN";
    const bOpen = b.status === "OPEN";
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function getPastStandings(orgId: string) {
  const rows = await prisma.seasonStanding.findMany({
    where: { orgId },
    orderBy: [{ season: "desc" }, { rank: "asc" }],
  });
  // season 별로 묶기
  const bySeasons = new Map<number, typeof rows>();
  for (const r of rows) {
    if (!bySeasons.has(r.season)) bySeasons.set(r.season, []);
    bySeasons.get(r.season)!.push(r);
  }
  return [...bySeasons.entries()].map(([season, standings]) => ({ season, standings }));
}
