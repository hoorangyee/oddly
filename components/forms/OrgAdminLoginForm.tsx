"use client";

import { useActionState } from "react";
import { orgAdminLogin } from "@/lib/actions/auth";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

export function OrgAdminLoginForm({ orgSlug }: { orgSlug: string }) {
  const [state, action] = useActionState(orgAdminLogin, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <div>
        <label className={labelClass} htmlFor="adminKey">
          조직 관리자 키
        </label>
        <input
          id="adminKey"
          name="adminKey"
          type="password"
          className={inputClass}
          placeholder="oddly_admin_..."
          autoFocus
        />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton className="w-full">관리자 로그인</SubmitButton>
    </form>
  );
}
