import "dotenv/config";
import { prisma } from "../lib/db";
import { hashKey, newInviteCode, newAdminKey } from "../lib/keys";
import { MarketType, MarketStatus, BetStatus, DEFAULT_STARTING_BALANCE } from "../lib/constants";

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  // 초기화(조직 삭제 시 cascade 로 전부 정리)
  await prisma.organization.deleteMany();

  const inviteCode = "DEMO2026";
  const adminKey = newAdminKey();

  const org = await prisma.organization.create({
    data: {
      name: "데모 팀",
      slug: "demo",
      inviteCode,
      adminKeyHash: hashKey(adminKey),
      startingBalance: DEFAULT_STARTING_BALANCE,
    },
  });

  const names = ["박민후", "영희", "철수", "민지"];
  const members = await Promise.all(
    names.map((nickname) =>
      prisma.member.create({
        data: { orgId: org.id, nickname, balance: org.startingBalance },
      }),
    ),
  );
  const [minhoo, younghee, chulsoo, minji] = members;

  // 마켓 1: 이진
  const m1 = await prisma.market.create({
    data: {
      orgId: org.id,
      creatorId: minhoo.id,
      title: "다음 주 금요일 안에 신규 배포가 나갈까?",
      description: "이번 스프린트 마감. 금요일 자정 전 프로덕션 배포 성공 여부.",
      type: MarketType.BINARY,
      status: MarketStatus.OPEN,
      closesAt: new Date(Date.now() + 5 * DAY),
      outcomes: {
        create: [
          { label: "예", sortOrder: 0 },
          { label: "아니오", sortOrder: 1 },
        ],
      },
    },
    include: { outcomes: true },
  });
  const yes = m1.outcomes.find((o) => o.label === "예")!;
  const no = m1.outcomes.find((o) => o.label === "아니오")!;

  await placeSeedBet(younghee.id, m1.id, yes.id, 500);
  await placeSeedBet(minji.id, m1.id, yes.id, 200);
  await placeSeedBet(chulsoo.id, m1.id, no.id, 400);

  // 마켓 2: 멀티초이스
  const m2 = await prisma.market.create({
    data: {
      orgId: org.id,
      creatorId: younghee.id,
      title: "이번 분기 사내 MVP는 누구?",
      description: "분기 회고에서 뽑히는 MVP 예측.",
      type: MarketType.MULTI,
      status: MarketStatus.OPEN,
      closesAt: new Date(Date.now() + 12 * DAY),
      outcomes: {
        create: [
          { label: "박민후", sortOrder: 0 },
          { label: "영희", sortOrder: 1 },
          { label: "철수", sortOrder: 2 },
        ],
      },
    },
    include: { outcomes: true },
  });
  await placeSeedBet(chulsoo.id, m2.id, m2.outcomes[0].id, 300);
  await placeSeedBet(minji.id, m2.id, m2.outcomes[1].id, 150);
  await placeSeedBet(minhoo.id, m2.id, m2.outcomes[2].id, 250);

  console.log("\n✅ Seed 완료");
  console.log("────────────────────────────────────────");
  console.log(`조직 slug     : ${org.slug}  →  http://localhost:3000/${org.slug}`);
  console.log(`초대 코드     : ${inviteCode}`);
  console.log(`조직 관리자키 : ${adminKey}`);
  console.log(`슈퍼관리자키  : ${process.env.SUPER_ADMIN_KEY}`);
  console.log("멤버          :", names.join(", "));
  console.log("────────────────────────────────────────\n");
}

async function placeSeedBet(memberId: string, marketId: string, outcomeId: string, amount: number) {
  await prisma.$transaction([
    prisma.bet.create({
      data: { memberId, marketId, outcomeId, amount, status: BetStatus.ACTIVE },
    }),
    prisma.outcome.update({ where: { id: outcomeId }, data: { poolTotal: { increment: amount } } }),
    prisma.member.update({ where: { id: memberId }, data: { balance: { decrement: amount } } }),
  ]);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
