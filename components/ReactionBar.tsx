"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
  Categories,
  EmojiStyle,
  Theme,
  type CategoryConfig,
  type EmojiClickData,
} from "emoji-picker-react";
import { LuSmilePlus } from "react-icons/lu";
import { toggleReaction } from "@/lib/actions/social";
import type { GroupedReaction } from "@/lib/reactions";
import { CustomEmojiForm } from "./forms/CustomEmojiForm";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });
const EMOJI_PICKER_WIDTH = 304;
const EMOJI_PICKER_HEIGHT = 320;
const EMOJI_PICKER_ESTIMATED_HEIGHT = 374;
const POPOVER_GAP = 8;
const POPOVER_MARGIN = 12;

const emojiPickerStyle = {
  "--epr-category-label-height": "28px",
  "--epr-category-navigation-button-size": "26px",
  "--epr-emoji-fullsize": "30px",
  "--epr-emoji-padding": "4px",
  "--epr-emoji-size": "22px",
  "--epr-search-input-height": "36px",
} as CSSProperties;

const CUSTOM_EMOJI_CATEGORY: CategoryConfig = {
  category: Categories.CUSTOM,
  name: "커스텀 이모티콘",
};

const STANDARD_EMOJI_CATEGORIES: CategoryConfig[] = [
  { category: Categories.SUGGESTED, name: "자주 사용" },
  { category: Categories.SMILEYS_PEOPLE, name: "스마일과 사람" },
  { category: Categories.ANIMALS_NATURE, name: "동물과 자연" },
  { category: Categories.FOOD_DRINK, name: "음식과 음료" },
  { category: Categories.TRAVEL_PLACES, name: "여행과 장소" },
  { category: Categories.ACTIVITIES, name: "활동" },
  { category: Categories.OBJECTS, name: "사물" },
  { category: Categories.SYMBOLS, name: "기호" },
  { category: Categories.FLAGS, name: "깃발" },
];

type CustomEmojiOption = {
  id: string;
  shortcode: string;
  imageUrl: string;
};

type ReactionTarget = {
  type: "MARKET" | "COMMENT";
  id: string;
};

type PopoverPosition = {
  top: number;
  left: number;
};

export function ReactionBar({
  orgId,
  orgSlug,
  target,
  groupedReactions,
  customEmojis,
  canReact,
  className = "",
}: {
  orgId: string;
  orgSlug: string;
  target: ReactionTarget;
  groupedReactions: GroupedReaction[];
  customEmojis: CustomEmojiOption[];
  canReact: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogTitleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pickerButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const customEmojiByPickerId = useMemo(
    () => new Map(customEmojis.map((emoji) => [toPickerCustomEmojiId(emoji.shortcode), emoji])),
    [customEmojis],
  );
  const custom = useMemo(
    () =>
      customEmojis.map((emoji) => ({
        id: toPickerCustomEmojiId(emoji.shortcode),
        names: [emoji.shortcode, emoji.shortcode.slice(1, -1)],
        imgUrl: emoji.imageUrl,
      })),
    [customEmojis],
  );
  const categories = useMemo(
    (): CategoryConfig[] =>
      custom.length > 0
        ? [CUSTOM_EMOJI_CATEGORY, ...STANDARD_EMOJI_CATEGORIES]
        : STANDARD_EMOJI_CATEGORIES,
    [custom.length],
  );

  useEffect(() => {
    if (!open) return;

    function closePicker() {
      setOpen(false);
      setPopoverPosition(null);
    }

    function updatePopoverPosition() {
      const button = pickerButtonRef.current;
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const popoverHeight =
        popoverRef.current?.offsetHeight || EMOJI_PICKER_ESTIMATED_HEIGHT;
      const maxLeft = window.innerWidth - EMOJI_PICKER_WIDTH - POPOVER_MARGIN;
      const left = clamp(buttonRect.left, POPOVER_MARGIN, Math.max(POPOVER_MARGIN, maxLeft));
      const spaceBelow = window.innerHeight - buttonRect.bottom - POPOVER_GAP - POPOVER_MARGIN;
      const spaceAbove = buttonRect.top - POPOVER_GAP - POPOVER_MARGIN;
      const shouldPlaceAbove = spaceBelow < popoverHeight && spaceAbove > spaceBelow;
      const preferredTop = shouldPlaceAbove
        ? buttonRect.top - POPOVER_GAP - popoverHeight
        : buttonRect.bottom + POPOVER_GAP;
      const maxTop = window.innerHeight - popoverHeight - POPOVER_MARGIN;
      const top = clamp(preferredTop, POPOVER_MARGIN, Math.max(POPOVER_MARGIN, maxTop));

      setPopoverPosition({ top, left });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pickerButtonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }

      closePicker();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePicker();
      }
    }

    const frame = window.requestAnimationFrame(updatePopoverPosition);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!uploadOpen) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUploadOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uploadOpen]);

  function submitReaction(value: { emoji?: string; customEmojiId?: string }) {
    if (!canReact || isPending) return;

    const formData = new FormData();
    formData.set("orgId", orgId);
    formData.set("orgSlug", orgSlug);
    formData.set("targetType", target.type);
    formData.set("targetId", target.id);
    if (value.emoji) formData.set("emoji", value.emoji);
    if (value.customEmojiId) formData.set("customEmojiId", value.customEmojiId);

    startTransition(async () => {
      await toggleReaction(formData);
      setOpen(false);
      router.refresh();
    });
  }

  function handleEmojiSelect(selected: EmojiClickData) {
    const customEmoji = customEmojiByPickerId.get(selected.unified);
    if (selected.isCustom && customEmoji) {
      submitReaction({ customEmojiId: customEmoji.id });
      return;
    }

    if (selected.emoji) {
      submitReaction({ emoji: selected.emoji });
    }
  }

  return (
    <div className={`relative flex flex-wrap items-center gap-2 ${className}`}>
      {groupedReactions.map((reaction) => (
        <span key={reaction.key} className="group relative inline-flex">
          <button
            type="button"
            disabled={!canReact || isPending}
            onClick={() =>
              submitReaction(
                reaction.kind === "unicode"
                  ? { emoji: reaction.emoji }
                  : { customEmojiId: reaction.customEmoji.id },
              )
            }
            aria-label={`${reaction.label} 반응 ${reaction.active ? "제거" : "추가"}`}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
              reaction.active
                ? "border-violet-400 bg-violet-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {reaction.kind === "custom" ? (
              // eslint-disable-next-line @next/next/no-img-element -- Custom emoji URLs are user-uploaded Blob URLs.
              <img
                src={reaction.customEmoji.imageUrl}
                alt={reaction.customEmoji.shortcode}
                className="h-5 w-5 object-contain"
              />
            ) : (
              <span>{reaction.emoji}</span>
            )}
            <span className="tabular-nums text-xs text-slate-500">{reaction.count}</span>
          </button>
          {reaction.reactorNames.length > 0 && <ReactionHoverCard reaction={reaction} />}
        </span>
      ))}

      <button
        type="button"
        ref={pickerButtonRef}
        disabled={!canReact || isPending}
        onClick={() => {
          setPopoverPosition(null);
          setOpen((next) => !next);
        }}
        aria-label="이모지 반응 추가"
        title={canReact ? "이모지 반응 추가" : "조직에 참여하면 반응할 수 있습니다"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LuSmilePlus aria-hidden="true" className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="fixed z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          style={{
            left: popoverPosition?.left ?? 0,
            top: popoverPosition?.top ?? 0,
            visibility: popoverPosition ? "visible" : "hidden",
          }}
        >
          <EmojiPicker
            categories={categories}
            customEmojis={custom}
            emojiStyle={EmojiStyle.NATIVE}
            height={EMOJI_PICKER_HEIGHT}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
            searchPlaceholder="이모지 검색"
            skinTonesDisabled
            style={emojiPickerStyle}
            theme={Theme.LIGHT}
            width={EMOJI_PICKER_WIDTH}
            onEmojiClick={handleEmojiSelect}
          />
          <div className="border-t border-slate-100 bg-white p-2">
            <button
              type="button"
              className="flex h-9 w-full items-center justify-center rounded-md text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              onClick={() => {
                setOpen(false);
                setUploadOpen(true);
              }}
            >
              이모티콘 추가
            </button>
          </div>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="이모티콘 추가 창 닫기"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setUploadOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id={dialogTitleId} className="text-base font-semibold text-slate-800">
                이모티콘 추가
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="닫기"
                onClick={() => setUploadOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              <CustomEmojiForm
                orgId={orgId}
                orgSlug={orgSlug}
                revalidatePathname={pathname}
                onSuccess={() => {
                  setUploadOpen(false);
                  setOpen(true);
                  router.refresh();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReactionHoverCard({ reaction }: { reaction: GroupedReaction }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden min-w-32 max-w-48 -translate-x-1/2 flex-col items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-lg group-hover:flex group-focus-within:flex"
    >
      {reaction.kind === "custom" ? (
        // eslint-disable-next-line @next/next/no-img-element -- Custom emoji URLs are user-uploaded Blob URLs.
        <img
          src={reaction.customEmoji.imageUrl}
          alt=""
          className="mb-2 h-14 w-14 rounded-sm object-contain"
        />
      ) : (
        <span className="mb-2 text-5xl leading-none">{reaction.emoji}</span>
      )}
      <span className="break-keep text-xs font-semibold leading-5 text-slate-800">
        {reaction.reactorNames.join(", ")}
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white"
      />
    </span>
  );
}

function toPickerCustomEmojiId(shortcode: string): string {
  return shortcode.slice(1, -1).toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
