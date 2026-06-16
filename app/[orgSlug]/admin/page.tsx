import Link from "next/link";
import {
  getOrgBySlug,
  listMarkets,
  listMembers,
  listAnnouncements,
  listPointAdjustments,
} from "@/lib/data";
import { isOrgAdmin } from "@/lib/auth";
import { orgAdminLogout } from "@/lib/actions/auth";
import { resetSeason } from "@/lib/actions/orgs";
import { deleteAnnouncement } from "@/lib/actions/admin";
import { OrgAdminLoginForm } from "@/components/forms/OrgAdminLoginForm";
import { AdjustPointsForm } from "@/components/forms/AdjustPointsForm";
import { AnnouncementForm } from "@/components/forms/AnnouncementForm";
import { DeleteMemberButton } from "@/components/forms/DeleteMemberButton";
import { Card, MarketStatusBadge } from "@/components/ui";
import { formatDateTime, formatPoints } from "@/lib/format";
import { MarketStatus } from "@/lib/constants";

export default async function OrgAdminPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) return null;

  const admin = await isOrgAdmin(org.id);

  if (!admin) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-xl font-bold text-slate-800">조직 관리자</h1>
        <Card className="p-6">
          <OrgAdminLoginForm orgSlug={orgSlug} />
        </Card>
      </div>
    );
  }

  const [markets, members, announcements, adjustments] = await Promise.all([
    listMarkets(org.id),
    listMembers(org.id),
    listAnnouncements(org.id),
    listPointAdjustments(org.id),
  ]);
  const pending = markets.filter(
    (m) => m.status !== MarketStatus.RESOLVED && m.status !== MarketStatus.VOID,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">조직 관리 · {org.name}</h1>
        <form action={orgAdminLogout}>
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <button type="submit" className="text-sm text-slate-400 hover:text-rose-500">
            관리자 로그아웃
          </button>
        </form>
      </div>

      {/* 조직 정보 / 초대 */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">초대 정보</h2>
        <div className="space-y-1 text-sm text-slate-600">
          <div>
            초대 코드:{" "}
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-800">
              {org.inviteCode}
            </span>
          </div>
          <div className="text-slate-400">
            참여 링크: <span className="font-mono">/{org.slug}/join?invite={org.inviteCode}</span>
          </div>
          <div className="text-slate-400">현재 시즌: {org.season}</div>
        </div>
      </Card>

      {/* 공지사항 */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">공지사항</h2>
        <AnnouncementForm orgSlug={orgSlug} />
        {announcements.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-slate-700">{a.body}</p>
                  <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
                </div>
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="orgSlug" value={orgSlug} />
                  <input type="hidden" name="announcementId" value={a.id} />
                  <button
                    type="submit"
                    className="shrink-0 whitespace-nowrap text-xs text-slate-400 hover:text-rose-600 hover:underline"
                  >
                    삭제
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 포인트 조정 */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">포인트 지급 · 차감</h2>
        <AdjustPointsForm orgSlug={orgSlug} members={members} />
        {adjustments.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
            {adjustments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-600">
                  {a.member.nickname}
                  {a.reason && <span className="text-slate-400"> · {a.reason}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`tabular-nums font-medium ${a.amount >= 0 ? "text-emerald-700" : "text-rose-600"}`}
                  >
                    {a.amount >= 0 ? "+" : "−"}
                    {formatPoints(Math.abs(a.amount))}
                  </span>
                  <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 멤버 관리 */}
      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-500">멤버 관리 ({members.length})</h2>
        <p className="mb-3 text-xs text-slate-400">
          삭제 시 해당 멤버의 베팅·댓글·기록이 모두 삭제됩니다. (만든 마켓은 유지)
        </p>
        {members.length === 0 ? (
          <p className="text-sm text-slate-400">멤버가 없습니다.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-700">{m.nickname}</span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-slate-500">{formatPoints(m.balance)}</span>
                  <DeleteMemberButton orgSlug={orgSlug} memberId={m.id} nickname={m.nickname} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 정산 대기 마켓 */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-500">결과 확정 대기 ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">확정할 마켓이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((m) => {
              const closed = m.closesAt.getTime() <= Date.now();
              return (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/${orgSlug}/markets/${m.id}`}
                    className="truncate text-sm text-slate-700 hover:text-violet-700"
                  >
                    {m.title}
                  </Link>
                  <MarketStatusBadge status={m.status} closed={closed} />
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-400">
          각 마켓 상세 페이지에서 승리 결과를 선택해 정산합니다.
        </p>
      </Card>

      {/* 시즌 리셋 (위험) */}
      <Card className="border-rose-200 bg-rose-50 p-5">
        <h2 className="text-sm font-semibold text-rose-800">시즌 리셋</h2>
        <p className="mt-1 mb-3 text-xs text-rose-700">
          현재 순위를 기록으로 남기고, <b>모든 멤버 점수를 {org.startingBalance.toLocaleString()}P로 초기화</b>합니다.
          진행 중인 마켓은 무효 처리됩니다. 되돌릴 수 없습니다.
        </p>
        <form action={resetSeason}>
          <input type="hidden" name="orgSlug" value={orgSlug} />
          <button
            type="submit"
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            시즌 {org.season} 마감하고 리셋
          </button>
        </form>
      </Card>
    </div>
  );
}
