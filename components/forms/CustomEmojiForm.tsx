"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCustomEmoji } from "@/lib/actions/social";
import { SubmitButton } from "../SubmitButton";
import { FieldError, inputClass } from "../ui";

export function CustomEmojiForm({
  orgId,
  orgSlug,
  onSuccess,
  revalidatePathname,
  className = "",
}: {
  orgId: string;
  orgSlug: string;
  onSuccess?: () => void;
  revalidatePathname?: string;
  className?: string;
}) {
  const [state, action] = useActionState(createCustomEmoji, null);
  const ref = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!state?.ok) return;

    ref.current?.reset();
    onSuccessRef.current?.();
  }, [state]);

  return (
    <form ref={ref} action={action} className={`space-y-3 ${className}`}>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {revalidatePathname && (
        <input type="hidden" name="revalidatePathname" value={revalidatePathname} />
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]">
        <input
          name="shortcode"
          className={inputClass}
          placeholder="이름 예: party_parrot"
          maxLength={42}
          required
        />
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-slate-700"
          required
        />
        <SubmitButton pendingText="업로드 중…">추가</SubmitButton>
      </div>
      <FieldError message={state?.error} />
      {state?.ok && state.message && <p className="text-sm text-emerald-600">{state.message}</p>}
      <p className="text-xs text-slate-400">png, jpg, webp, gif · 1MB 이하</p>
    </form>
  );
}
