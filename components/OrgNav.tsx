import Link from "next/link";
import { formatPoints } from "@/lib/format";
import { Badge } from "./ui";
import { memberLogout } from "@/lib/actions/auth";

type Props = {
  org: { slug: string; name: string; season: number };
  member: { nickname: string; balance: number } | null;
  isAdmin: boolean;
};

export function OrgNav({ org, member, isAdmin }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link href={`/${org.slug}`} className="text-lg font-bold tracking-tight text-violet-700">
          Oddly
        </Link>
        <span className="text-sm text-slate-500">{org.name}</span>
        <Badge color="slate">시즌 {org.season}</Badge>

        <nav className="ml-auto flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Link href={`/${org.slug}`} className="hover:text-violet-700">
            마켓
          </Link>
          <Link href={`/${org.slug}/leaderboard`} className="hover:text-violet-700">
            리더보드
          </Link>
          <Link href={`/${org.slug}/contact`} className="hover:text-violet-700">
            문의
          </Link>
          {member && (
            <Link href={`/${org.slug}/markets/new`} className="hover:text-violet-700">
              + 새 마켓
            </Link>
          )}
          {member && (
            <Link href={`/${org.slug}/settings`} className="hover:text-violet-700">
              설정
            </Link>
          )}
          <Link href={`/${org.slug}/admin`} className="hover:text-violet-700">
            {isAdmin ? "관리자 ✓" : "관리자"}
          </Link>

          {member ? (
            <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
              <span className="font-medium text-slate-700">{member.nickname}</span>
              <span className="tabular-nums font-semibold text-violet-700">
                {formatPoints(member.balance)}
              </span>
              <form action={memberLogout}>
                <input type="hidden" name="orgSlug" value={org.slug} />
                <button type="submit" className="text-xs text-slate-400 hover:text-rose-500">
                  로그아웃
                </button>
              </form>
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <Link href={`/${org.slug}/login`} className="hover:text-violet-700">
                로그인
              </Link>
              <Link
                href={`/${org.slug}/join`}
                className="rounded-lg bg-violet-600 px-3 py-1 font-medium text-white hover:bg-violet-700"
              >
                참여하기
              </Link>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
