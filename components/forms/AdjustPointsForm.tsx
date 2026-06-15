"use client";

import { useActionState } from "react";
import { adjustPoints } from "@/lib/actions/admin";
import { ADJUST_ALL } from "@/lib/validation";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

type Member = { id: string; nickname: string; balance: number };

export function AdjustPointsForm({ orgSlug, members }: { orgSlug: string; members: Member[] }) {
  const [state, action] = useActionState(adjustPoints, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div>
        <label className={labelClass} htmlFor="target">
          대상
        </label>
        <select id="target" name="target" className={inputClass} defaultValue={ADJUST_ALL}>
          <option value={ADJUST_ALL}>전체 멤버</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname} ({m.balance.toLocaleString()}P)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="amount">
          점수 (지급 +, 차감 −)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          className={inputClass}
          placeholder="예: 1000 또는 -500"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="reason">
          사유 (선택)
        </label>
        <input
          id="reason"
          name="reason"
          className={inputClass}
          maxLength={200}
          placeholder="예: 이벤트 보상"
        />
      </div>
      {state?.ok && state.message && <p className="text-sm text-emerald-600">{state.message}</p>}
      <FieldError message={state?.error} />
      <SubmitButton>적용</SubmitButton>
    </form>
  );
}
