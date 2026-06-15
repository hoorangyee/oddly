"use client";

import { useActionState } from "react";
import { createOrganization } from "@/lib/actions/orgs";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

export function CreateOrgForm() {
  const [state, action] = useActionState(createOrganization, null);
  const created = state && "ok" in state && state.ok ? state : null;

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="name">
            조직 이름
          </label>
          <input id="name" name="name" className={inputClass} placeholder="예: 백엔드팀" maxLength={40} />
        </div>
        <div>
          <label className={labelClass} htmlFor="slug">
            slug (URL)
          </label>
          <input id="slug" name="slug" className={inputClass} placeholder="backend" />
        </div>
        <div>
          <label className={labelClass} htmlFor="startingBalance">
            시작 점수
          </label>
          <input
            id="startingBalance"
            name="startingBalance"
            type="number"
            defaultValue={10000}
            min={100}
            className={inputClass}
          />
        </div>
        <FieldError message={state && "error" in state ? state.error : undefined} />
        <SubmitButton className="w-full">조직 만들기</SubmitButton>
      </form>

      {created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-800">✅ &quot;{created.name}&quot; 생성됨</p>
          <p className="mt-2 text-emerald-700">
            아래 키는 <b>지금만 표시</b>됩니다. 꼭 복사해두세요.
          </p>
          <dl className="mt-2 space-y-1 font-mono text-xs text-slate-700">
            <div>참여 링크: /{created.slug}/join?invite={created.inviteCode}</div>
            <div>초대 코드: {created.inviteCode}</div>
            <div>관리자 키: {created.adminKey}</div>
          </dl>
        </div>
      )}
    </div>
  );
}
