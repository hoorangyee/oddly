import { redirect } from "next/navigation";
import { getOrgBySlug, getCurrentMember } from "@/lib/data";
import { LoginForm } from "@/components/forms/LoginForm";
import { Card } from "@/components/ui";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) return null;

  const member = await getCurrentMember(org.id);
  if (member) redirect(`/${orgSlug}`);

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-lg font-bold text-slate-800">{org.name} 로그인</h1>
        <p className="mt-1 mb-4 text-sm text-slate-500">닉네임과 PIN으로 다시 로그인하세요.</p>
        <LoginForm orgSlug={orgSlug} />
      </Card>
    </div>
  );
}
