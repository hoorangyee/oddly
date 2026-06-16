import { describe, expect, test } from "vitest";
import {
  canDeleteCustomEmoji,
  normalizeCustomEmojiShortcode,
  validateCustomEmojiUpload,
} from "./custom-emojis";

describe("normalizeCustomEmojiShortcode", () => {
  test("stores names with Slack-style surrounding colons", () => {
    expect(normalizeCustomEmojiShortcode("party_parrot")).toBe(":party_parrot:");
    expect(normalizeCustomEmojiShortcode(":Party-Parrot:")).toBe(":party-parrot:");
  });

  test("accepts unicode letters and numbers for organization-local names", () => {
    expect(normalizeCustomEmojiShortcode("100점")).toBe(":100점:");
  });

  test("rejects empty, too long, or unsafe names", () => {
    expect(() => normalizeCustomEmojiShortcode(":")).toThrow("이모지 이름을 입력하세요");
    expect(() => normalizeCustomEmojiShortcode("a".repeat(41))).toThrow("40자 이하");
    expect(() => normalizeCustomEmojiShortcode("party parrot")).toThrow("이모지 이름");
  });
});

describe("validateCustomEmojiUpload", () => {
  test("accepts supported image files up to 1MB", () => {
    expect(
      validateCustomEmojiUpload({
        name: "party.gif",
        type: "image/gif",
        size: 1024 * 1024,
      }),
    ).toEqual({ extension: "gif", contentType: "image/gif" });
  });

  test("rejects unsupported file types and files larger than 1MB", () => {
    expect(() =>
      validateCustomEmojiUpload({ name: "party.svg", type: "image/svg+xml", size: 100 }),
    ).toThrow("png, jpg, webp, gif");
    expect(() =>
      validateCustomEmojiUpload({ name: "party.png", type: "image/png", size: 1024 * 1024 + 1 }),
    ).toThrow("1MB 이하");
  });
});

describe("canDeleteCustomEmoji", () => {
  test("allows the creator or an org admin to delete custom emoji", () => {
    expect(canDeleteCustomEmoji({ creatorId: "m1" }, "m1", false)).toBe(true);
    expect(canDeleteCustomEmoji({ creatorId: "m1" }, "m2", true)).toBe(true);
    expect(canDeleteCustomEmoji({ creatorId: "m1" }, "m2", false)).toBe(false);
  });
});
