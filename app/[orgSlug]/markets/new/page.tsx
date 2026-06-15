import Link from "next/link";
import { getOrgBySlug, getCurrentMember } from "@/lib/data";
import { CreateMarketForm } from "@/components/forms/CreateMarketForm";
import { Card } from "@/components/ui";

export default async function NewMarketPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) return null;

  const member = await getCurrentMember(org.id);
  if (!member) {
    return (
      <Card className="p-6 text-center text-slate-600">
        마켓을 만들려면 먼저{" "}
        <Link href={`/${orgSlug}/join`} className="font-medium text-violet-700 underline">
          조직에 참여
        </Link>
        하세요.
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold text-slate-800">새 마켓 만들기</h1>
      <Card className="p-6">
        <CreateMarketForm orgId={org.id} orgSlug={orgSlug} />
      </Card>
    </div>
  );
}
