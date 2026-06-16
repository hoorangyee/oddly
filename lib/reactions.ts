import emojiData from "emoji-picker-react/dist/data/emojis-ko.json";

export type CustomEmojiSummary = {
  id: string;
  shortcode: string;
  imageUrl: string;
};

export type ReactionListItem = {
  memberId: string;
  emoji: string | null;
  customEmoji: CustomEmojiSummary | null;
};

export type GroupedReaction =
  | {
      key: string;
      kind: "unicode";
      label: string;
      count: number;
      active: boolean;
      emoji: string;
      customEmoji: null;
    }
  | {
      key: string;
      kind: "custom";
      label: string;
      count: number;
      active: boolean;
      emoji: null;
      customEmoji: CustomEmojiSummary;
    };

export function isSupportedUnicodeEmoji(value: string): boolean {
  return supportedUnifiedEmojis.has(toUnified(value));
}

function toUnified(value: string): string {
  return [...value]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter((codePoint): codePoint is string => codePoint != null)
    .join("-");
}

type EmojiPickerDataEmoji = {
  u: string;
  v?: string[];
};

const supportedUnifiedEmojis = new Set(
  Object.values(emojiData.emojis)
    .flat()
    .flatMap((emoji: EmojiPickerDataEmoji) => [emoji.u, ...(emoji.v ?? [])]),
);

export function groupReactions(
  reactions: ReactionListItem[],
  currentMemberId: string | null,
): GroupedReaction[] {
  const groups = new Map<string, GroupedReaction>();

  for (const reaction of reactions) {
    const group = getReactionGroup(reaction);
    if (!group) continue;

    const existing = groups.get(group.key);
    if (existing) {
      existing.count += 1;
      existing.active = existing.active || reaction.memberId === currentMemberId;
    } else {
      groups.set(group.key, {
        ...group,
        count: 1,
        active: reaction.memberId === currentMemberId,
      } as GroupedReaction);
    }
  }

  return [...groups.values()];
}

export function getTopReactionGroups(
  reactions: ReactionListItem[],
  limit: number,
): GroupedReaction[] {
  return groupReactions(reactions, null)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getReactionGroup(
  reaction: ReactionListItem,
): Omit<GroupedReaction, "count" | "active"> | null {
  if (reaction.customEmoji) {
    return {
      key: `custom:${reaction.customEmoji.id}`,
      kind: "custom",
      label: reaction.customEmoji.shortcode,
      emoji: null,
      customEmoji: reaction.customEmoji,
    };
  }

  if (reaction.emoji) {
    return {
      key: `unicode:${reaction.emoji}`,
      kind: "unicode",
      label: reaction.emoji,
      emoji: reaction.emoji,
      customEmoji: null,
    };
  }

  return null;
}
