import { toggleReaction } from "@/lib/actions/social";
import { REACTION_EMOJIS } from "@/lib/constants";

type R = { emoji: string; memberId: string };

export function ReactionBar({
  orgId,
  orgSlug,
  marketId,
  reactions,
  currentMemberId,
}: {
  orgId: string;
  orgSlug: string;
  marketId: string;
  reactions: R[];
  currentMemberId: string | null;
}) {
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of reactions) {
    counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
    if (currentMemberId && r.memberId === currentMemberId) mine.add(r.emoji);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_EMOJIS.map((emoji) => {
        const count = counts.get(emoji) ?? 0;
        const active = mine.has(emoji);
        return (
          <form key={emoji} action={toggleReaction}>
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="orgSlug" value={orgSlug} />
            <input type="hidden" name="marketId" value={marketId} />
            <input type="hidden" name="emoji" value={emoji} />
            <button
              type="submit"
              disabled={!currentMemberId}
              className={`rounded-full border px-2.5 py-1 text-sm transition disabled:opacity-50 ${
                active
                  ? "border-violet-400 bg-violet-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {emoji}
              {count > 0 && <span className="ml-1 tabular-nums text-xs text-slate-500">{count}</span>}
            </button>
          </form>
        );
      })}
    </div>
  );
}
