// 도메인 상태/유형 상수. SQLite enum 미지원이라 String 컬럼 + 여기 상수로 관리.

export const MarketType = {
  BINARY: "BINARY",
  MULTI: "MULTI",
} as const;
export type MarketType = (typeof MarketType)[keyof typeof MarketType];

export const MarketStatus = {
  OPEN: "OPEN", // 베팅 가능
  CLOSED: "CLOSED", // 마감(베팅 불가, 정산 대기) — 마감 시각 경과 시 표시상 처리
  RESOLVED: "RESOLVED", // 정산 완료
  VOID: "VOID", // 무효(전원 환불)
} as const;
export type MarketStatus = (typeof MarketStatus)[keyof typeof MarketStatus];

export const BetStatus = {
  ACTIVE: "ACTIVE",
  WON: "WON",
  LOST: "LOST",
  REFUNDED: "REFUNDED",
} as const;
export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus];

export const InquiryStatus = {
  OPEN: "OPEN", // 접수됨(미해결)
  RESOLVED: "RESOLVED", // 처리 완료
} as const;
export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];

export const DEFAULT_STARTING_BALANCE = 10000;
export const MIN_BET = 1;

// 마켓 반응에 쓰는 이모지 셋
export const REACTION_EMOJIS = ["👍", "🔥", "😂", "😮", "😢"] as const;
