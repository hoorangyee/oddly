// 파리뮤추얼(pool) 정산 — 순수 함수. DB/IO 없음 → 단위 테스트로 정확성 보장.
//
// 표시 확률:   prob_i      = P_i / T
// 예상 배당:   multiplier_i = T / P_i        (i가 이길 때 1P당 환급, 자기 베팅 반영 전 근사)
// 정산:        payout_u     = stake_u / P_W * T   (승리 결과 W)
//   - 플로어로 인한 잔여 점수는 "최대 잔여" 방식으로 승자에게 1P씩 분배 → 총 풀 정확히 보존.

export type OutcomePool = { outcomeId: string; poolTotal: number };

export type BetInput = {
  id: string;
  memberId: string;
  outcomeId: string;
  amount: number;
};

export type PayoutResult = {
  betId: string;
  memberId: string;
  payout: number;
  status: "WON" | "LOST" | "REFUNDED";
};

export type Settlement = {
  voided: boolean; // 승리 풀이 비어 전원 환불해야 하는 경우 true
  payouts: PayoutResult[];
};

export function computeOdds(
  pools: OutcomePool[],
): Record<string, { prob: number; multiplier: number }> {
  const total = pools.reduce((s, p) => s + p.poolTotal, 0);
  const out: Record<string, { prob: number; multiplier: number }> = {};
  for (const p of pools) {
    if (total === 0 || p.poolTotal === 0) {
      out[p.outcomeId] = { prob: 0, multiplier: 0 };
    } else {
      out[p.outcomeId] = {
        prob: p.poolTotal / total,
        multiplier: total / p.poolTotal,
      };
    }
  }
  return out;
}

export function settleMarket(bets: BetInput[], winningOutcomeId: string): Settlement {
  if (bets.length === 0) return { voided: false, payouts: [] };

  const total = bets.reduce((s, b) => s + b.amount, 0);
  const winners = bets.filter((b) => b.outcomeId === winningOutcomeId);
  const winningPool = winners.reduce((s, b) => s + b.amount, 0);

  // 승리 풀이 비어 있으면 전원 환불
  if (winningPool === 0) return refundAll(bets);

  // 1) 각 승자 플로어 환급 + 잔여(소수부) 기록
  const winnerCalcs = winners.map((b) => {
    const exact = (b.amount / winningPool) * total;
    const floor = Math.floor(exact);
    return { bet: b, floor, frac: exact - floor };
  });

  let distributed = winnerCalcs.reduce((s, w) => s + w.floor, 0);
  let remainder = total - distributed; // 분배해야 할 잔여 점수(정수)

  // 2) 잔여를 소수부 큰 순서로 1P씩 분배(동률은 betId로 결정적 정렬)
  const order = [...winnerCalcs].sort(
    (a, b) => b.frac - a.frac || (a.bet.id < b.bet.id ? -1 : 1),
  );
  const bonus = new Map<string, number>();
  for (let i = 0; i < remainder; i++) {
    const w = order[i % order.length];
    bonus.set(w.bet.id, (bonus.get(w.bet.id) ?? 0) + 1);
  }

  const payouts: PayoutResult[] = bets.map((b) => {
    if (b.outcomeId === winningOutcomeId) {
      const calc = winnerCalcs.find((w) => w.bet.id === b.id)!;
      return {
        betId: b.id,
        memberId: b.memberId,
        payout: calc.floor + (bonus.get(b.id) ?? 0),
        status: "WON",
      };
    }
    return { betId: b.id, memberId: b.memberId, payout: 0, status: "LOST" };
  });

  return { voided: false, payouts };
}

export function refundAll(bets: BetInput[]): Settlement {
  return {
    voided: true,
    payouts: bets.map((b) => ({
      betId: b.id,
      memberId: b.memberId,
      payout: b.amount,
      status: "REFUNDED",
    })),
  };
}
