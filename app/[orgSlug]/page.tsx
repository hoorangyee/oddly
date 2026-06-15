import Link from "next/link";
import { getOrgBySlug, listMarkets, listAnnouncements } from "@/lib/data";
import { MarketCard } from "@/components/MarketCard";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Card } from "@/components/ui";

export default async function OrgHome({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) return null;

  const [markets, announcements] = await Promise.all([
    listMarkets(org.id),
    listAnnouncements(org.id),
  ]);

  return (
    <div className="space-y-4">
      <AutoRefresh />
      <AnnouncementBanner announcements={announcements} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">마켓</h1>
        <Link
          href={`/${orgSlug}/markets/new`}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          + 새 마켓
        </Link>
      </div>

      {markets.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          아직 마켓이 없어요. 첫 베팅 주제를 만들어보세요!
        </Card>
      ) : (
        <div className="space-y-3">
          {markets.map((m) => (
            <MarketCard key={m.id} orgSlug={orgSlug} market={m} />
          ))}
        </div>
      )}
    </div>
  );
}
