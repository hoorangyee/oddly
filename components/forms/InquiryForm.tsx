"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInquiry } from "@/lib/actions/inquiries";
import { SubmitButton } from "../SubmitButton";
import { inputClass, FieldError } from "../ui";

export function InquiryForm({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [state, action] = useActionState(createInquiry, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <textarea
        name="body"
        rows={3}
        className={inputClass}
        maxLength={1000}
        placeholder="관리자에게 문의할 내용을 적어주세요"
      />
      {state?.ok && (
        <p className="text-sm text-emerald-600">문의가 접수됐어요. 답변을 기다려주세요.</p>
      )}
      <FieldError message={state?.error} />
      <div className="flex justify-end">
        <SubmitButton>문의 보내기</SubmitButton>
      </div>
    </form>
  );
}
