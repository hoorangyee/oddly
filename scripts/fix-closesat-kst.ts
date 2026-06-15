// 일회성 데이터 마이그레이션 — closesAt KST 보정
// ---------------------------------------------------------------------------
// 배경: KST 보정 수정 이전, 운영 서버(Vercel = UTC)에서 생성된 마켓의 closesAt 은
//       관리자가 의도한 KST 벽시각보다 9시간 늦게 저장돼 있다.
//       (datetime-local "14:30" 을 UTC 14:30 = KST 23:30 으로 파싱했기 때문)
//       → 해당 마켓의 closesAt 에서 9시간을 빼 의도한 KST 시각으로 보정한다.
//
// 보정 대상 판별:
//   1) createdAt 이 --before(수정 배포 시각) 이전  — 수정 이후 생성분은 이미 정상이라 제외
//   2) closesAt 이 "분 단위 정렬"(초=0, ms=0)       — 관리자 datetime-local 입력의 특징.
//                                                    시드/프로그램 생성분(Date.now 기반)은 초·ms 가
//                                                    살아있어 자동 제외된다.
//   3) 이미 보정 로그에 기록된 마켓 제외             — 재실행 시 이중 보정(-18h) 방지
//   (--ids 로 특정 마켓만 지정하면 2) 정렬 조건은 건너뛰고 1)·3) 만 적용)
//
// 안전장치: 기본은 드라이런(쓰기 없음). 실제 반영은 --apply 필요.
//
// 사용법(운영 Turso 자격증명을 주입해서 실행):
//   DATABASE_URL="libsql://<db>.turso.io" DATABASE_AUTH_TOKEN="<token>" \
//     npx tsx scripts/fix-closesat-kst.ts                 # 드라이런(대상 미리보기)
//   DATABASE_URL="..." DATABASE_AUTH_TOKEN="..." \
//     npx tsx scripts/fix-closesat-kst.ts --apply         # 실제 보정
//   옵션: --before "2026-06-15T00:00:00Z"  (기본: 현재 시각)
//         --ids "id1,id2"                  (특정 마켓만)
// ---------------------------------------------------------------------------
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { prisma } from "../lib/db";
import { toKstDateTimeLocal } from "../lib/time";

const OFFSET_MS = 9 * 60 * 60 * 1000;
const LOG_PATH = join(dirname(fileURLToPath(import.meta.url)), ".closesat-kst-applied.json");

type AppliedEntry = { id: string; fromISO: string; toISO: string; atISO: string };

function parseArgs(argv: string[]) {
  const apply = argv.includes("--apply");
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const beforeRaw = get("--before");
  const before = beforeRaw ? new Date(beforeRaw) : new Date();
  if (isNaN(before.getTime())) throw new Error(`--before 값이 올바른 날짜가 아닙니다: ${beforeRaw}`);
  const idsRaw = get("--ids");
  const ids = idsRaw ? idsRaw.split(",").map((s) => s.trim()).filter(Boolean) : null;
  return { apply, before, ids };
}

function loadApplied(): AppliedEntry[] {
  if (!existsSync(LOG_PATH)) return [];
  try {
    return JSON.parse(readFileSync(LOG_PATH, "utf8")) as AppliedEntry[];
  } catch {
    return [];
  }
}

function maskTarget(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const scheme = url.split(":")[0];
  const host = url.replace(/^\w+:\/\//, "").split(/[/?]/)[0];
  return `${scheme} (${host || "local file"})`;
}

async function main() {
  const { apply, before, ids } = parseArgs(process.argv.slice(2));
  const applied = loadApplied();
  const appliedIds = new Set(applied.map((a) => a.id));

  console.log("─".repeat(64));
  console.log("closesAt KST 보정 마이그레이션");
  console.log("  대상 DB     :", maskTarget());
  console.log("  모드        :", apply ? "APPLY (실제 반영)" : "DRY-RUN (미리보기, 쓰기 없음)");
  console.log("  cutoff      : createdAt <", toKstDateTimeLocal(before), "KST 이전");
  if (ids) console.log("  --ids 지정  :", ids.join(", "), "(분 단위 정렬 조건 무시)");
  console.log("  이미 보정됨 :", appliedIds.size, "건");
  console.log("─".repeat(64));

  const markets = await prisma.market.findMany({
    select: { id: true, title: true, status: true, createdAt: true, closesAt: true },
    orderBy: { createdAt: "asc" },
  });

  const selected: { id: string; title: string; from: Date; to: Date; status: string }[] = [];
  for (const m of markets) {
    if (appliedIds.has(m.id)) continue;
    if (ids && !ids.includes(m.id)) continue;
    if (m.createdAt.getTime() >= before.getTime()) continue;
    const aligned = m.closesAt.getUTCSeconds() === 0 && m.closesAt.getUTCMilliseconds() === 0;
    if (!ids && !aligned) continue; // 시드/프로그램 생성분 제외 (--ids 지정 시는 건너뜀)

    const to = new Date(m.closesAt.getTime() - OFFSET_MS);
    selected.push({ id: m.id, title: m.title, from: m.closesAt, to, status: m.status });
  }

  if (selected.length === 0) {
    console.log("\n보정 대상이 없습니다. (전체 마켓:", markets.length, "건)");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n보정 대상 ${selected.length}건 (전체 ${markets.length}건):\n`);
  for (const s of selected) {
    console.log(`  [${s.status}] ${s.id.slice(0, 8)}  ${s.title.slice(0, 36)}`);
    console.log(`      마감: ${toKstDateTimeLocal(s.from)} KST  →  ${toKstDateTimeLocal(s.to)} KST  (-9h)`);
  }

  if (!apply) {
    console.log("\n드라이런입니다. 실제 반영하려면 --apply 를 붙여 다시 실행하세요.");
    await prisma.$disconnect();
    return;
  }

  console.log("\n반영 중...");
  const now = new Date();
  await prisma.$transaction(
    selected.map((s) => prisma.market.update({ where: { id: s.id }, data: { closesAt: s.to } })),
  );

  const newLog: AppliedEntry[] = [
    ...applied,
    ...selected.map((s) => ({
      id: s.id,
      fromISO: s.from.toISOString(),
      toISO: s.to.toISOString(),
      atISO: now.toISOString(),
    })),
  ];
  writeFileSync(LOG_PATH, JSON.stringify(newLog, null, 2));

  console.log(`✅ ${selected.length}건 보정 완료. 로그: ${LOG_PATH}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
