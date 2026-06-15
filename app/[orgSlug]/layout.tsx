import { notFound } from "next/navigation";
import { getOrgBySlug, getCurrentMember } from "@/lib/data";
import { isOrgAdmin } from "@/lib/auth";
import { OrgNav } from "@/components/OrgNav";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) notFound();

  const [member, admin] = await Promise.all([getCurrentMember(org.id), isOrgAdmin(org.id)]);

  return (
    <>
      <OrgNav
        org={{ slug: org.slug, name: org.name, season: org.season }}
        member={member ? { nickname: member.nickname, balance: member.balance } : null}
        isAdmin={admin}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
