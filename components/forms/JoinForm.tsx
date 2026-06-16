"use client";

import { useActionState } from "react";
import Link from "next/link";
import { joinOrg } from "@/lib/actions/orgs";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

export function JoinForm({ orgSlug, defaultInvite = "" }: { orgSlug: string; defaultInvite?: string }) {
  const [state, action] = useActionState(joinOrg, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div>
        <label className={labelClass} htmlFor="nickname">
          닉네임
        </label>
        <input id="nickname" name="nickname" className={inputClass} placeholder="예: 박민후" autoFocus maxLength={20} />
      </div>
      <div>
        <label className={labelClass} htmlFor="inviteCode">
          초대 코드
        </label>
        <input
          id="inviteCode"
          name="inviteCode"
          className={inputClass}
          placeholder="조직 관리자에게 받은 코드"
          defaultValue={defaultInvite}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="pin">
          PIN (숫자 4~6자리)
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={6}
          className={inputClass}
          placeholder="재로그인에 사용할 PIN"
        />
        <p className="mt-1 text-xs text-slate-400">로그아웃 후 닉네임 + PIN으로 다시 로그인합니다.</p>
      </div>
      <FieldError message={state?.error} />
      <SubmitButton className="w-full">참여하기</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        이미 가입했나요?{" "}
        <Link href={`/${orgSlug}/login`} className="font-medium text-violet-700 underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
