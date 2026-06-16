import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrgBySlug,
  getCurrentMember,
  listInquiriesForMember,
  listInquiries,
} from "@/lib/data";
import { isOrgAdmin } from "@/lib/auth";
import { toggleInquiryStatus, deleteInquiry } from "@/lib/actions/inquiries";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { InquiryReplyForm } from "@/components/forms/InquiryReplyForm";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Card, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { InquiryStatus } from "@/lib/constants";

function StatusBadge({ status }: { status: string }) {
  return status === InquiryStatus.RESOLVED ? (
    <Badge color="green">완료</Badge>
  ) : (
    <Badge color="amber">접수</Badge>
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) notFound();

  const [member, admin] = await Promise.all([getCurrentMember(org.id), isOrgAdmin(org.id)]);
  const myInquiries = member ? await listInquiriesForMember(org.id, member.id) : [];
  const allInquiries = admin ? await listInquiries(org.id) : [];
  const openCount = allInquiries.filter((i) => i.status === InquiryStatus.OPEN).length;

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <h1 className="text-xl font-bold text-slate-800">문의</h1>
      <p className="-mt-3 text-sm text-slate-500">
        궁금한 점이나 정산 이의 등을 관리자에게 직접 문의할 수 있어요.
      </p>

      {/* 관리자 받은함 */}
      {admin && (
        <Card className="border-violet-200 bg-violet-50/50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-violet-800">
            받은 문의 ({allInquiries.length}) · 미해결 {openCount}
          </h2>
          {allInquiries.length === 0 ? (
            <p className="text-sm text-slate-400">아직 들어온 문의가 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {allInquiries.map((q) => (
                <li key={q.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">{q.member.nickname}</span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={q.status} />
                      <span className="text-xs text-slate-400">{formatDateTime(q.createdAt)}</span>
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{q.body}</p>

                  {q.reply && (
                    <div className="mt-3 rounded-md bg-violet-50 p-3 text-sm">
                      <div className="mb-0.5 text-xs font-semibold text-violet-700">관리자 답변</div>
                      <p className="whitespace-pre-wrap text-slate-700">{q.reply}</p>
                    </div>
                  )}

                  <InquiryReplyForm orgSlug={orgSlug} inquiryId={q.id} hasReply={!!q.reply} />

                  <div className="mt-2 flex items-center justify-end gap-3 text-xs">
                    <form action={toggleInquiryStatus}>
                      <input type="hidden" name="orgSlug" value={orgSlug} />
                      <input type="hidden" name="inquiryId" value={q.id} />
                      <button type="submit" className="text-slate-500 hover:text-violet-700 hover:underline">
                        {q.status === InquiryStatus.RESOLVED ? "미해결로 되돌리기" : "해결로 표시"}
                      </button>
                    </form>
                    <form action={deleteInquiry}>
                      <input type="hidden" name="orgSlug" value={orgSlug} />
                      <input type="hidden" name="inquiryId" value={q.id} />
                      <button type="submit" className="text-slate-400 hover:text-rose-600 hover:underline">
                        삭제
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* 멤버: 문의 작성 */}
      {member ? (
        <>
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">문의 보내기</h2>
            <InquiryForm orgId={org.id} orgSlug={orgSlug} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-500">내 문의 ({myInquiries.length})</h2>
            {myInquiries.length === 0 ? (
              <p className="text-sm text-slate-400">아직 보낸 문의가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {myInquiries.map((q) => (
                  <li key={q.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <StatusBadge status={q.status} />
                      <span className="text-xs text-slate-400">{formatDateTime(q.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{q.body}</p>
                    {q.reply && (
                      <div className="mt-2 rounded-md bg-violet-50 p-3 text-sm">
                        <div className="mb-0.5 text-xs font-semibold text-violet-700">관리자 답변</div>
                        <p className="whitespace-pre-wrap text-slate-700">{q.reply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : (
        !admin && (
          <Card className="p-4 text-center text-sm text-slate-600">
            문의하려면{" "}
            <Link href={`/${orgSlug}/join`} className="font-medium text-violet-700 underline">
              참여하기
            </Link>
          </Card>
        )
      )}
    </div>
  );
}
