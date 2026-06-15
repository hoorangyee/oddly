import { redirect } from "next/navigation";
import { getOrgBySlug, getCurrentMember } from "@/lib/data";
import { JoinForm } from "@/components/forms/JoinForm";
import { Card } from "@/components/ui";
import { formatPoints } from "@/lib/format";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { orgSlug } = await params;
  const { invite } = await searchParams;
  const org = await getOrgBySlug(orgSlug);
  if (!org) return null;

  const member = await getCurrentMember(org.id);
  if (member) redirect(`/${orgSlug}`);

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-lg font-bold text-slate-800">{org.name} 참여하기</h1>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          닉네임만 정하면 바로 시작! 시작 점수 {formatPoints(org.startingBalance)}가 지급됩니다.
        </p>
        <JoinForm orgSlug={orgSlug} defaultInvite={invite} />
      </Card>
    </div>
  );
}
