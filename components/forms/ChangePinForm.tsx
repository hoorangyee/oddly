"use client";

import { useActionState } from "react";
import { changeMyPin } from "@/lib/actions/orgs";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

export function ChangePinForm({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [state, action] = useActionState(changeMyPin, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div>
        <label className={labelClass} htmlFor="pin">
          새 PIN (숫자 4~6자리)
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          className={inputClass}
          placeholder="새 PIN"
        />
      </div>
      {state?.ok && <p className="text-sm text-emerald-600">PIN이 변경됐어요.</p>}
      <FieldError message={state?.error} />
      <SubmitButton>PIN 변경</SubmitButton>
    </form>
  );
}
