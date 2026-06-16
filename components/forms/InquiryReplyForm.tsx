"use client";

import { useActionState, useEffect, useRef } from "react";
import { replyInquiry } from "@/lib/actions/inquiries";
import { inputClass, FieldError } from "../ui";

export function InquiryReplyForm({
  orgSlug,
  inquiryId,
  hasReply,
}: {
  orgSlug: string;
  inquiryId: string;
  hasReply: boolean;
}) {
  const [state, action] = useActionState(replyInquiry, null);
  const ref = useRef<HTMLFormElement>(null);

  // 답변 등록 성공 시 입력창 비우기 (현재 답변은 위 '관리자 답변' 박스에 표시됨)
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="mt-3 space-y-2">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <textarea
        name="reply"
        rows={2}
        className={inputClass}
        maxLength={1000}
        placeholder={hasReply ? "답변을 수정하려면 새 내용을 입력하세요" : "답변을 입력하세요"}
      />
      <FieldError message={state?.error} />
      <div className="flex items-center justify-end gap-3 text-xs">
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-700"
        >
          {hasReply ? "답변 수정" : "답변 등록"}
        </button>
      </div>
    </form>
  );
}
