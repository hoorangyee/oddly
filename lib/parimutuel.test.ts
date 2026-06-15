import { describe, it, expect } from "vitest";
import { computeOdds, settleMarket, refundAll, type BetInput } from "./parimutuel";

function bet(id: string, outcomeId: string, amount: number, memberId = "m-" + id): BetInput {
  return { id, outcomeId, amount, memberId };
}

describe("computeOdds", () => {
  it("풀 비율로 확률(%)과 배당 배수를 계산한다", () => {
    const odds = computeOdds([
      { outcomeId: "yes", poolTotal: 400 },
      { outcomeId: "no", poolTotal: 600 },
    ]);
    expect(odds.yes.prob).toBeCloseTo(0.4);
    expect(odds.no.prob).toBeCloseTo(0.6);
    expect(odds.yes.multiplier).toBeCloseTo(1000 / 400); // 2.5
    expect(odds.no.multiplier).toBeCloseTo(1000 / 600);
  });

  it("베팅이 전혀 없으면 확률/배당은 0", () => {
    const odds = computeOdds([
      { outcomeId: "yes", poolTotal: 0 },
      { outcomeId: "no", poolTotal: 0 },
    ]);
    expect(odds.yes.prob).toBe(0);
    expect(odds.yes.multiplier).toBe(0);
  });
});

describe("settleMarket", () => {
  it("기획안 워크드 예시: YES 승 → A750/B250, C 패", () => {
    const bets = [
      bet("A", "yes", 300),
      bet("B", "yes", 100),
      bet("C", "no", 600),
    ];
    const res = settleMarket(bets, "yes");
    expect(res.voided).toBe(false);
    const byId = Object.fromEntries(res.payouts.map((p) => [p.betId, p]));
    expect(byId.A.payout).toBe(750);
    expect(byId.A.status).toBe("WON");
    expect(byId.B.payout).toBe(250);
    expect(byId.B.status).toBe("WON");
    expect(byId.C.payout).toBe(0);
    expect(byId.C.status).toBe("LOST");
  });

  it("승자 환급 합계 = 총 풀(점수 보존)", () => {
    const bets = [
      bet("A", "yes", 333),
      bet("B", "yes", 111),
      bet("C", "no", 555),
      bet("D", "no", 1),
    ];
    const total = bets.reduce((s, b) => s + b.amount, 0);
    const res = settleMarket(bets, "yes");
    const paid = res.payouts.reduce((s, p) => s + p.payout, 0);
    expect(paid).toBe(total); // 반올림 잔여까지 분배되어 정확히 보존
  });

  it("승리 풀이 비어 있으면 전원 환불(void)", () => {
    const bets = [bet("A", "no", 100), bet("B", "no", 50)];
    const res = settleMarket(bets, "yes");
    expect(res.voided).toBe(true);
    for (const p of res.payouts) {
      expect(p.status).toBe("REFUNDED");
      expect(p.payout).toBe(bets.find((b) => b.id === p.betId)!.amount);
    }
  });

  it("한쪽에만 베팅 후 그쪽이 이기면 본전 환급(이익 0)", () => {
    const bets = [bet("A", "yes", 200), bet("B", "yes", 300)];
    const res = settleMarket(bets, "yes");
    const byId = Object.fromEntries(res.payouts.map((p) => [p.betId, p]));
    expect(byId.A.payout).toBe(200);
    expect(byId.B.payout).toBe(300);
  });

  it("멀티초이스: 승리 결과만 풀 전체를 비율대로 가져간다", () => {
    const bets = [
      bet("A", "x", 100),
      bet("B", "y", 100),
      bet("C", "z", 200),
      bet("D", "x", 100),
    ]; // T=500, x풀=200
    const res = settleMarket(bets, "x");
    const byId = Object.fromEntries(res.payouts.map((p) => [p.betId, p]));
    // A,D 각 100/200*500 = 250
    expect(byId.A.payout).toBe(250);
    expect(byId.D.payout).toBe(250);
    expect(byId.B.status).toBe("LOST");
    expect(byId.C.status).toBe("LOST");
    const paid = res.payouts.reduce((s, p) => s + p.payout, 0);
    expect(paid).toBe(500);
  });

  it("베팅이 하나도 없으면 빈 정산", () => {
    const res = settleMarket([], "yes");
    expect(res.payouts).toEqual([]);
  });
});

describe("refundAll", () => {
  it("전원 원금 환불 + REFUNDED", () => {
    const bets = [bet("A", "yes", 100), bet("B", "no", 70)];
    const res = refundAll(bets);
    expect(res.voided).toBe(true);
    const byId = Object.fromEntries(res.payouts.map((p) => [p.betId, p]));
    expect(byId.A.payout).toBe(100);
    expect(byId.A.status).toBe("REFUNDED");
    expect(byId.B.payout).toBe(70);
  });
});
