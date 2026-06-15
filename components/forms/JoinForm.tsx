"use client";

import { useActionState } from "react";
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
      <FieldError message={state?.error} />
      <SubmitButton className="w-full">참여하기</SubmitButton>
    </form>
  );
}
