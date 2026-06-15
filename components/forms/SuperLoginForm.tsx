"use client";

import { useActionState } from "react";
import { superLogin } from "@/lib/actions/auth";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

export function SuperLoginForm() {
  const [state, action] = useActionState(superLogin, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="key">
          슈퍼관리자 키
        </label>
        <input id="key" name="key" type="password" className={inputClass} autoFocus />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton className="w-full">로그인</SubmitButton>
    </form>
  );
}
