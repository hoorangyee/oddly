import { redirect } from "next/navigation";
import { getOrgBySlug, getCurrentMember } from "@/lib/data";
import { ChangePinForm } from "@/components/forms/ChangePinForm";
import { Card } from "@/components/ui";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) return null;

  const member = await getCurrentMember(org.id);
  if (!member) redirect(`/${orgSlug}/login`);

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-xl font-bold text-slate-800">설정</h1>
      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-500">PIN 변경</h2>
        <p className="mb-3 text-xs text-slate-400">
          {member.nickname} 님의 재로그인 PIN을 변경합니다.
        </p>
        <ChangePinForm orgId={org.id} orgSlug={orgSlug} />
      </Card>
    </div>
  );
}
