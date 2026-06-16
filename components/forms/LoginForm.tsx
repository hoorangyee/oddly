"use client";

import { useActionState } from "react";
import Link from "next/link";
import { memberLogin } from "@/lib/actions/orgs";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

export function LoginForm({ orgSlug }: { orgSlug: string }) {
  const [state, action] = useActionState(memberLogin, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div>
        <label className={labelClass} htmlFor="nickname">
          닉네임
        </label>
        <input id="nickname" name="nickname" className={inputClass} placeholder="가입한 닉네임" autoFocus maxLength={20} />
      </div>
      <div>
        <label className={labelClass} htmlFor="pin">
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          className={inputClass}
          placeholder="숫자 4~6자리"
        />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton className="w-full">로그인</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        처음이신가요?{" "}
        <Link href={`/${orgSlug}/join`} className="font-medium text-violet-700 underline">
          가입하기
        </Link>
      </p>
    </form>
  );
}
