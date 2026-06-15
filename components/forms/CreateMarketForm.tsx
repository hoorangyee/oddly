"use client";

import { useActionState, useEffect, useState } from "react";
import { createMarket } from "@/lib/actions/markets";
import { MarketType } from "@/lib/constants";
import { SubmitButton } from "../SubmitButton";
import { inputClass, labelClass, FieldError } from "../ui";

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateMarketForm({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [state, action] = useActionState(createMarket, null);
  const [type, setType] = useState<string>(MarketType.BINARY);
  const [closesAt, setClosesAt] = useState("");

  // 마운트 후 기본 마감(+3일) 설정 — SSR 하이드레이션 불일치 방지
  useEffect(() => {
    setClosesAt(toLocalInput(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)));
  }, []);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />

      <div>
        <label className={labelClass} htmlFor="title">
          질문(제목)
        </label>
        <input id="title" name="title" className={inputClass} placeholder="예: 다음 주 금요일 안에 배포가 나갈까?" maxLength={140} autoFocus />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          설명 (선택)
        </label>
        <textarea id="description" name="description" rows={2} className={inputClass} placeholder="정산 기준을 명확히 적어두면 분쟁이 줄어요." maxLength={1000} />
      </div>

      <div>
        <span className={labelClass}>유형</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType(MarketType.BINARY)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              type === MarketType.BINARY
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-300 text-slate-500"
            }`}
          >
            예 / 아니오
          </button>
          <button
            type="button"
            onClick={() => setType(MarketType.MULTI)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              type === MarketType.MULTI
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-300 text-slate-500"
            }`}
          >
            멀티초이스
          </button>
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {type === MarketType.MULTI && (
        <div>
          <label className={labelClass} htmlFor="outcomesText">
            선택지 (한 줄에 하나, 2~8개)
          </label>
          <textarea
            id="outcomesText"
            name="outcomesText"
            rows={4}
            className={inputClass}
            placeholder={"박민후\n영희\n철수"}
          />
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="closesAt">
          베팅 마감 시각
        </label>
        <input
          id="closesAt"
          name="closesAt"
          type="datetime-local"
          className={inputClass}
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
        />
      </div>

      <FieldError message={state?.error} />
      <SubmitButton className="w-full">마켓 만들기</SubmitButton>
    </form>
  );
}
