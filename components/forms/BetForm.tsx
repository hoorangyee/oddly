"use client";

import { useActionState, useEffect, useState } from "react";
import { placeBet } from "@/lib/actions/markets";
import { SubmitButton } from "../SubmitButton";
import { inputClass, FieldError } from "../ui";
import { formatPoints } from "@/lib/format";

type Outcome = { id: string; label: string };

export function BetForm({
  orgId,
  orgSlug,
  marketId,
  outcomes,
  balance,
}: {
  orgId: string;
  orgSlug: string;
  marketId: string;
  outcomes: Outcome[];
  balance: number;
}) {
  const [state, action] = useActionState(placeBet, null);
  const [outcomeId, setOutcomeId] = useState(outcomes[0]?.id ?? "");
  const [amount, setAmount] = useState("");

  // 베팅 성공 시 금액 초기화
  useEffect(() => {
    if (state?.ok) setAmount("");
  }, [state]);

  const quick = [100, 500, 1000];

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="marketId" value={marketId} />
      <input type="hidden" name="outcomeId" value={outcomeId} />

      <div className="grid grid-cols-2 gap-2">
        {outcomes.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOutcomeId(o.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              outcomeId === o.id
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          max={balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="베팅 점수"
          className={inputClass}
        />
        <SubmitButton pendingText="베팅 중…">베팅</SubmitButton>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {quick.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String(Math.min(q, balance)))}
            className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 hover:bg-slate-200"
          >
            {q}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmount(String(balance))}
          className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 hover:bg-slate-200"
        >
          올인
        </button>
        <span className="ml-auto text-slate-400">보유 {formatPoints(balance)}</span>
      </div>

      <FieldError message={state?.error} />
    </form>
  );
}
