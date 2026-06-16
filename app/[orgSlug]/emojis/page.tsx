import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteCustomEmoji } from "@/lib/actions/social";
import { isOrgAdmin } from "@/lib/auth";
import { canDeleteCustomEmoji } from "@/lib/custom-emojis";
import { getCurrentMember, getOrgBySlug, listCustomEmojis } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { CustomEmojiForm } from "@/components/forms/CustomEmojiForm";
import { Card } from "@/components/ui";

export default async function EmojisPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrgBySlug(orgSlug);
  if (!org) notFound();

  const [member, admin, customEmojis] = await Promise.all([
    getCurrentMember(org.id),
    isOrgAdmin(org.id),
    listCustomEmojis(org.id),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">커스텀 이모지</h1>
        <p className="mt-1 text-sm text-slate-500">
          조직 안에서 쓸 이모지를 직접 업로드합니다.
        </p>
      </div>

      <Card className="p-5">
        {member ? (
          <CustomEmojiForm orgId={org.id} orgSlug={orgSlug} />
        ) : (
          <p className="text-sm text-slate-500">
            이모지를 추가하려면{" "}
            <Link href={`/${orgSlug}/join`} className="text-violet-700 underline">
              참여
            </Link>
            하세요.
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
          등록된 이모지 {customEmojis.length}
        </div>
        {customEmojis.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            아직 등록된 커스텀 이모지가 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {customEmojis.map((emoji) => {
              const canDelete =
                member != null && canDeleteCustomEmoji(emoji, member.id, admin);
              return (
                <li key={emoji.id} className="flex items-center gap-3 px-5 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Custom emoji URLs are user-uploaded Blob URLs. */}
                  <img
                    src={emoji.imageUrl}
                    alt={emoji.shortcode}
                    className="h-9 w-9 shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-800">{emoji.shortcode}</div>
                    <div className="text-xs text-slate-400">
                      {emoji.creator.nickname} · {formatDateTime(emoji.createdAt)}
                    </div>
                  </div>
                  {canDelete && (
                    <form action={deleteCustomEmoji}>
                      <input type="hidden" name="orgId" value={org.id} />
                      <input type="hidden" name="orgSlug" value={orgSlug} />
                      <input type="hidden" name="customEmojiId" value={emoji.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        삭제
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
