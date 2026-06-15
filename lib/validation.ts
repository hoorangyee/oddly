import { z } from "zod";
import { MarketType } from "./constants";
import { parseKstDateTimeLocal } from "./time";

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, "닉네임을 입력하세요")
  .max(20, "닉네임은 20자 이하");

export const joinSchema = z.object({
  inviteCode: z.string().trim().min(1, "초대 코드를 입력하세요"),
  nickname: nicknameSchema,
});

export const createMarketSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력하세요").max(140, "제목은 140자 이하"),
    description: z.string().trim().max(1000, "설명은 1000자 이하").default(""),
    type: z.enum([MarketType.BINARY, MarketType.MULTI]),
    // datetime-local 문자열을 KST 벽시계로 해석한다.
    closesAt: z
      .string()
      .min(1, "마감 시각을 입력하세요")
      .transform((s, ctx) => {
        const d = parseKstDateTimeLocal(s);
        if (!d) {
          ctx.addIssue("마감 시각 형식이 올바르지 않습니다");
          return z.NEVER;
        }
        if (d.getTime() <= Date.now()) {
          ctx.addIssue("마감 시각은 미래여야 합니다");
          return z.NEVER;
        }
        return d;
      }),
    // MULTI 일 때만 사용. 줄바꿈으로 구분된 선택지.
    outcomes: z.array(z.string().trim().min(1).max(40)).optional(),
  })
  .refine(
    (v) => v.type === MarketType.BINARY || (v.outcomes && v.outcomes.length >= 2),
    { message: "멀티초이스는 선택지가 2개 이상이어야 합니다", path: ["outcomes"] },
  )
  .refine((v) => !v.outcomes || v.outcomes.length <= 8, {
    message: "선택지는 최대 8개",
    path: ["outcomes"],
  });

export const placeBetSchema = z.object({
  outcomeId: z.string().min(1, "선택지를 고르세요"),
  amount: z.coerce.number().int("정수만 가능").positive("0보다 커야 합니다"),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "내용을 입력하세요").max(500, "500자 이하"),
});

export const ADJUST_ALL = "ALL";

export const adjustPointsSchema = z.object({
  // 대상: 특정 멤버 id 또는 전체("ALL")
  target: z.string().trim().min(1, "대상을 선택하세요"),
  // 양수=지급, 음수=차감. 0 불가.
  amount: z.coerce
    .number()
    .int("정수만 가능")
    .refine((n) => n !== 0, "0이 아닌 값을 입력하세요")
    .refine((n) => Math.abs(n) <= 100_000_000, "값이 너무 큽니다"),
  reason: z.string().trim().max(200, "사유는 200자 이하").default(""),
});

export const announcementSchema = z.object({
  body: z.string().trim().min(1, "내용을 입력하세요").max(500, "500자 이하"),
});

export const inquirySchema = z.object({
  body: z.string().trim().min(1, "문의 내용을 입력하세요").max(1000, "1000자 이하"),
});

export const inquiryReplySchema = z.object({
  reply: z.string().trim().min(1, "답변 내용을 입력하세요").max(1000, "1000자 이하"),
});

export const createOrgSchema = z.object({
  name: z.string().trim().min(1, "조직 이름을 입력하세요").max(40),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,30}$/, "slug 은 영문 소문자/숫자/하이픈 2~30자"),
  startingBalance: z.coerce.number().int().min(100).max(100_000_000).default(10000),
});
