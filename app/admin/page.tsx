import Link from "next/link";
import { prisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/auth";
import { superLogout } from "@/lib/actions/auth";
import { deleteOrganization } from "@/lib/actions/orgs";
import { SuperLoginForm } from "@/components/forms/SuperLoginForm";
import { CreateOrgForm } from "@/components/forms/CreateOrgForm";
import { Card } from "@/components/ui";

export default async function SuperAdminPage() {
  const isSuper = await isSuperAdmin();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-violet-700">
          Oddly
        </Link>
        <span className="text-sm text-slate-500">슈퍼관리자</span>
      </div>

      {!isSuper ? (
        <Card className="mx-auto max-w-md p-6">
          <h1 className="mb-4 text-lg font-bold text-slate-800">슈퍼관리자 로그인</h1>
          <SuperLoginForm />
        </Card>
      ) : (
        <SuperAdminPanel />
      )}
    </div>
  );
}

async function SuperAdminPanel() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true, markets: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <form action={superLogout}>
          <button type="submit" className="text-sm text-slate-400 hover:text-rose-500">
            로그아웃
          </button>
        </form>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-bold text-slate-800">새 조직 만들기</h2>
        <CreateOrgForm />
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 text-base font-bold text-slate-800">조직 목록 ({orgs.length})</h2>
        {orgs.length === 0 ? (
          <p className="text-sm text-slate-400">아직 조직이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orgs.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <Link href={`/${o.slug}`} className="font-medium text-slate-700 hover:text-violet-700">
                    {o.name}
                  </Link>
                  <span className="ml-2 text-xs text-slate-400">
                    /{o.slug} · 멤버 {o._count.members} · 마켓 {o._count.markets} · 시즌 {o.season}
                  </span>
                </div>
                <form action={deleteOrganization}>
                  <input type="hidden" name="orgId" value={o.id} />
                  <button type="submit" className="text-xs text-rose-500 hover:text-rose-700">
                    삭제
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
