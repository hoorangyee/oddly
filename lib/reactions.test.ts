import { describe, expect, test } from "vitest";
import {
  getTopReactionGroups,
  groupReactions,
  isSupportedUnicodeEmoji,
  type ReactionListItem,
} from "./reactions";

describe("groupReactions", () => {
  test("groups unicode reactions and marks the current member reaction as active", () => {
    const reactions: ReactionListItem[] = [
      { memberId: "m1", emoji: "👍", customEmoji: null },
      { memberId: "m2", emoji: "👍", customEmoji: null },
      { memberId: "m3", emoji: "🔥", customEmoji: null },
    ];

    const grouped = groupReactions(reactions, "m2");

    expect(grouped).toEqual([
      {
        key: "unicode:👍",
        kind: "unicode",
        label: "👍",
        count: 2,
        active: true,
        emoji: "👍",
        customEmoji: null,
      },
      {
        key: "unicode:🔥",
        kind: "unicode",
        label: "🔥",
        count: 1,
        active: false,
        emoji: "🔥",
        customEmoji: null,
      },
    ]);
  });

  test("groups custom emoji reactions separately from unicode reactions", () => {
    const reactions: ReactionListItem[] = [
      {
        memberId: "m1",
        emoji: null,
        customEmoji: { id: "ce1", shortcode: ":party:", imageUrl: "https://example.com/party.gif" },
      },
      {
        memberId: "m2",
        emoji: null,
        customEmoji: { id: "ce1", shortcode: ":party:", imageUrl: "https://example.com/party.gif" },
      },
      { memberId: "m2", emoji: "🎉", customEmoji: null },
    ];

    const grouped = groupReactions(reactions, "m2");

    expect(grouped).toEqual([
      {
        key: "custom:ce1",
        kind: "custom",
        label: ":party:",
        count: 2,
        active: true,
        emoji: null,
        customEmoji: { id: "ce1", shortcode: ":party:", imageUrl: "https://example.com/party.gif" },
      },
      {
        key: "unicode:🎉",
        kind: "unicode",
        label: "🎉",
        count: 1,
        active: true,
        emoji: "🎉",
        customEmoji: null,
      },
    ]);
  });
});

describe("getTopReactionGroups", () => {
  test("returns the most used reactions up to the requested limit", () => {
    const reactions: ReactionListItem[] = [
      { memberId: "m1", emoji: "🔥", customEmoji: null },
      { memberId: "m2", emoji: "🔥", customEmoji: null },
      { memberId: "m3", emoji: "👍", customEmoji: null },
      {
        memberId: "m4",
        emoji: null,
        customEmoji: {
          id: "ce1",
          shortcode: ":shipit:",
          imageUrl: "https://example.com/shipit.png",
        },
      },
      {
        memberId: "m5",
        emoji: null,
        customEmoji: {
          id: "ce1",
          shortcode: ":shipit:",
          imageUrl: "https://example.com/shipit.png",
        },
      },
      {
        memberId: "m6",
        emoji: null,
        customEmoji: {
          id: "ce1",
          shortcode: ":shipit:",
          imageUrl: "https://example.com/shipit.png",
        },
      },
      { memberId: "m7", emoji: "🎉", customEmoji: null },
    ];

    const topReactions = getTopReactionGroups(reactions, 2);

    expect(topReactions).toEqual([
      {
        key: "custom:ce1",
        kind: "custom",
        label: ":shipit:",
        count: 3,
        active: false,
        emoji: null,
        customEmoji: {
          id: "ce1",
          shortcode: ":shipit:",
          imageUrl: "https://example.com/shipit.png",
        },
      },
      {
        key: "unicode:🔥",
        kind: "unicode",
        label: "🔥",
        count: 2,
        active: false,
        emoji: "🔥",
        customEmoji: null,
      },
    ]);
  });
});

describe("isSupportedUnicodeEmoji", () => {
  test("accepts a single emoji from emoji-picker-react data", () => {
    expect(isSupportedUnicodeEmoji("👍")).toBe(true);
    expect(isSupportedUnicodeEmoji("👨‍👩‍👧‍👦")).toBe(true);
  });

  test("rejects non-emoji strings and multi-emoji input", () => {
    expect(isSupportedUnicodeEmoji("party")).toBe(false);
    expect(isSupportedUnicodeEmoji("👍👍")).toBe(false);
  });
});
