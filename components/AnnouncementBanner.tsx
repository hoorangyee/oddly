import { formatDateTime } from "@/lib/format";
import { Card } from "./ui";

type Announcement = { id: string; body: string; createdAt: Date };

// 마켓 목록 상단 공지 배너 — 조직 관리자가 등록한 공지를 최신순으로 노출
export function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;

  return (
    <Card className="border-violet-200 bg-violet-50 p-4">
      <h2 className="mb-2 text-sm font-semibold text-violet-800">📢 공지</h2>
      <ul className="space-y-2">
        {announcements.map((a) => (
          <li key={a.id} className="text-sm text-violet-900">
            <p className="whitespace-pre-wrap">{a.body}</p>
            <span className="text-xs text-violet-400">{formatDateTime(a.createdAt)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
