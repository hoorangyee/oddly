"use client";

import { useActionState } from "react";
import { setMemberPin } from "@/lib/actions/admin";
import { inputClass } from "../ui";

// 관리자: 멤버에게 PIN 지정/재설정. 전달용이라 입력값은 가리지 않음(평문 표시).
export function SetMemberPinForm({ orgSlug, memberId }: { orgSlug: string; memberId: string }) {
  const [state, action] = useActionState(setMemberPin, null);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="memberId" value={memberId} />
      <input
        name="pin"
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="새 PIN 지정"
        className={`${inputClass} w-28 py-1 text-xs`}
      />
      <button
        type="submit"
        className="shrink-0 whitespace-nowrap rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
      >
        지정
      </button>
      {state?.ok ? (
        <span className="text-xs text-emerald-600">완료</span>
      ) : state?.error ? (
        <span className="text-xs text-rose-600">{state.error}</span>
      ) : null}
    </form>
  );
}
