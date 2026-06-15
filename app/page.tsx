import Link from "next/link";
import { GoToOrg } from "@/components/GoToOrg";
import { Card } from "@/components/ui";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-slate-800">
        <span className="text-violet-700">Oddly</span> 🎲
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        점수로 즐기는 사내 예측 베팅 · 랭킹 서비스. 돈은 안 걸어요, 자존심만 걸어요.
      </p>

      <Card className="mt-8 p-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">우리 조직 입장하기</h2>
        <GoToOrg />
        <p className="mt-2 text-xs text-slate-400">
          조직 관리자에게 받은 slug(주소)와 초대 코드로 참여하세요.
        </p>
      </Card>

      <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <Card className="p-4">
          <div className="font-medium text-slate-700">파리뮤추얼 방식</div>
          <p className="mt-1 text-slate-500">
            양쪽에 모인 점수 풀을 맞춘 사람들이 비율대로 나눠 갖습니다. 베팅이 모일수록 확률이 움직여요.
          </p>
        </Card>
        <Card className="p-4">
          <div className="font-medium text-slate-700">조직별 랭킹</div>
          <p className="mt-1 text-slate-500">
            보유 점수로 순위를 매기고, 시즌마다 새로 시작할 수 있습니다.
          </p>
        </Card>
      </div>

      <div className="mt-8 text-sm">
        <Link href="/admin" className="text-violet-700 hover:underline">
          조직 만들기 / 슈퍼관리자 →
        </Link>
      </div>
    </div>
  );
}
