"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/lib/actions/social";
import { SubmitButton } from "../SubmitButton";
import { inputClass, FieldError } from "../ui";

export function CommentForm({
  orgId,
  orgSlug,
  marketId,
}: {
  orgId: string;
  orgSlug: string;
  marketId: string;
}) {
  const [state, action] = useActionState(addComment, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="marketId" value={marketId} />
      <div className="flex items-start gap-2">
        <input name="body" className={inputClass} placeholder="댓글 달기…" maxLength={500} />
        <SubmitButton pendingText="등록 중…">등록</SubmitButton>
      </div>
      <FieldError message={state?.error} />
    </form>
  );
}
