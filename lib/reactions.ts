import emojiData from "emoji-picker-react/dist/data/emojis-ko.json";

export type CustomEmojiSummary = {
  id: string;
  shortcode: string;
  imageUrl: string;
};

export type ReactionListItem = {
  memberId: string;
  memberNickname?: string | null;
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
      reactorNames: string[];
      emoji: string;
      customEmoji: null;
    }
  | {
      key: string;
      kind: "custom";
      label: string;
      count: number;
      active: boolean;
      reactorNames: string[];
      emoji: null;
      customEmoji: CustomEmojiSummary;
    };

const MAX_REACTOR_NAMES = 5;

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
      appendReactorName(existing.reactorNames, reaction);
    } else {
      groups.set(group.key, {
        ...group,
        count: 1,
        active: reaction.memberId === currentMemberId,
        reactorNames: getInitialReactorNames(reaction),
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
): Omit<GroupedReaction, "count" | "active" | "reactorNames"> | null {
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

function getInitialReactorNames(reaction: ReactionListItem): string[] {
  const name = getReactorName(reaction);
  return name ? [name] : [];
}

function appendReactorName(names: string[], reaction: ReactionListItem) {
  if (names.length >= MAX_REACTOR_NAMES) return;

  const name = getReactorName(reaction);
  if (!name || names.includes(name)) return;

  names.push(name);
}

function getReactorName(reaction: ReactionListItem): string | null {
  const name = reaction.memberNickname?.trim();
  return name ? name : null;
}
