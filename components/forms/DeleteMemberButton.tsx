"use client";

import { deleteMember } from "@/lib/actions/admin";

export function DeleteMemberButton({
  orgSlug,
  memberId,
  nickname,
}: {
  orgSlug: string;
  memberId: string;
  nickname: string;
}) {
  return (
    <form
      action={deleteMember}
      onSubmit={(e) => {
        if (
          !confirm(
            `'${nickname}' 멤버를 삭제할까요?\n베팅·댓글·기록이 모두 삭제됩니다. (이 멤버가 만든 마켓은 유지됩니다)`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="memberId" value={memberId} />
      <button
        type="submit"
        className="shrink-0 whitespace-nowrap text-xs text-slate-400 hover:text-rose-600 hover:underline"
      >
        삭제
      </button>
    </form>
  );
}
