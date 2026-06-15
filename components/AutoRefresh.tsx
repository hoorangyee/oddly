"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 확률·리더보드를 주기적으로 새로고침(서버 데이터 재요청). v1 의 "실시간" 대체.
export function AutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
