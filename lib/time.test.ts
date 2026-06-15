import { describe, it, expect } from "vitest";
import { parseKstDateTimeLocal, toKstDateTimeLocal } from "./time";
import { formatDateTime } from "./format";

describe("parseKstDateTimeLocal", () => {
  it("datetime-local 문자열을 KST 벽시계로 해석한다 (14:30 KST = 05:30 UTC)", () => {
    const d = parseKstDateTimeLocal("2026-06-18T14:30");
    expect(d?.toISOString()).toBe("2026-06-18T05:30:00.000Z");
  });

  it("초가 포함된 형식도 처리한다", () => {
    const d = parseKstDateTimeLocal("2026-06-18T14:30:45");
    expect(d?.toISOString()).toBe("2026-06-18T05:30:45.000Z");
  });

  it("자정 직후는 전날 15:00 UTC 로 환산된다", () => {
    const d = parseKstDateTimeLocal("2026-01-01T00:00");
    expect(d?.toISOString()).toBe("2025-12-31T15:00:00.000Z");
  });

  it("형식이 잘못되면 null", () => {
    expect(parseKstDateTimeLocal("")).toBeNull();
    expect(parseKstDateTimeLocal("2026/06/18 14:30")).toBeNull();
    expect(parseKstDateTimeLocal("not-a-date")).toBeNull();
  });
});

describe("toKstDateTimeLocal", () => {
  it("절대시각을 KST 벽시계 문자열로 변환한다", () => {
    expect(toKstDateTimeLocal(new Date("2026-06-18T05:30:00.000Z"))).toBe("2026-06-18T14:30");
  });

  it("parse 와 왕복(round-trip)이 일치한다", () => {
    const s = "2026-12-25T09:05";
    expect(toKstDateTimeLocal(parseKstDateTimeLocal(s)!)).toBe(s);
  });
});

describe("formatDateTime", () => {
  it("실행 환경 TZ 와 무관하게 KST 로 표시한다", () => {
    // 05:30 UTC = 14:30 KST(오후 2:30)
    const out = formatDateTime(new Date("2026-06-18T05:30:00.000Z"));
    expect(out).toContain("2:30");
    expect(out).not.toContain("5:30");
  });
});
