import { z } from "zod";
import { MarketType } from "./constants";

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
    closesAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), "마감 시각은 미래여야 합니다"),
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

export const createOrgSchema = z.object({
  name: z.string().trim().min(1, "조직 이름을 입력하세요").max(40),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,30}$/, "slug 은 영문 소문자/숫자/하이픈 2~30자"),
  startingBalance: z.coerce.number().int().min(100).max(100_000_000).default(10000),
});
