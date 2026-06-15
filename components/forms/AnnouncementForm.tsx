"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAnnouncement } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";
import { inputClass, FieldError } from "../ui";

export function AnnouncementForm({ orgSlug }: { orgSlug: string }) {
  const [state, action] = useActionState(createAnnouncement, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <textarea
        name="body"
        rows={2}
        className={inputClass}
        maxLength={500}
        placeholder="공지 내용을 입력하세요"
      />
      <FieldError message={state?.error} />
      <div className="flex justify-end">
        <SubmitButton>공지 등록</SubmitButton>
      </div>
    </form>
  );
}
