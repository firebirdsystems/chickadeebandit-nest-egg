import { describe, it, expect } from "vitest";
import {
  categoryIcon, categoryLabel,
  calcNetWorth, calcProgress,
  fmtMonthYear, fmtDate,
  latestOf, priorOf, calcTrend,
  buildNetWorthHistory,
} from "../src/logic.js";

describe("category helpers", () => {
  it("maps known categories and falls back for unknown", () => {
    expect(categoryIcon("home")).toBe("🏠");
    expect(categoryIcon("nope")).toBe("💼");
    expect(categoryLabel("credit_card")).toBe("Credit Card");
    expect(categoryLabel("nope")).toBe("nope");
  });
});

describe("calcNetWorth", () => {
  it("sums assets and liabilities separately, in cents", () => {
    const accounts = [
      { type: "asset", latestCents: 500_000 },
      { type: "asset", latestCents: 100_000 },
      { type: "liability", latestCents: 250_000 },
    ];
    expect(calcNetWorth(accounts)).toEqual({ assets: 600_000, liabilities: 250_000, netWorth: 350_000 });
  });

  it("treats missing values as 0 and handles empty input", () => {
    expect(calcNetWorth([{ type: "asset" }])).toEqual({ assets: 0, liabilities: 0, netWorth: 0 });
    expect(calcNetWorth([])).toEqual({ assets: 0, liabilities: 0, netWorth: 0 });
  });

  it("can go negative when liabilities exceed assets", () => {
    expect(calcNetWorth([{ type: "liability", latestCents: 100 }]).netWorth).toBe(-100);
  });
});

describe("calcProgress", () => {
  it("returns null without a positive target", () => {
    expect(calcProgress(100, 0)).toBeNull();
    expect(calcProgress(100, null)).toBeNull();
    expect(calcProgress(100, -5)).toBeNull();
  });

  it("returns the ratio, capped at 1", () => {
    expect(calcProgress(50, 200)).toBe(0.25);
    expect(calcProgress(300, 200)).toBe(1);
  });
});

describe("date formatting", () => {
  it("formats month-year and full dates from YYYY-MM-DD", () => {
    expect(fmtMonthYear("2025-01-15")).toBe("Jan 2025");
    expect(fmtDate("2025-05-24")).toBe("May 24, 2025");
  });

  it("accepts full ISO timestamps", () => {
    expect(fmtMonthYear("2025-01-15T10:00:00Z")).toMatch(/2025/);
  });

  it("returns '' for empty input", () => {
    expect(fmtMonthYear("")).toBe("");
    expect(fmtDate(null)).toBe("");
  });
});

describe("latestOf / priorOf / calcTrend", () => {
  const snaps = [
    { recorded_at: "2026-01-01", value_cents: 1 },
    { recorded_at: "2026-03-01", value_cents: 3 },
    { recorded_at: "2026-02-01", value_cents: 2 },
  ];

  it("latestOf picks the most recent snapshot", () => {
    expect(latestOf(snaps).recorded_at).toBe("2026-03-01");
    expect(latestOf([])).toBeNull();
    expect(latestOf(null)).toBeNull();
  });

  it("priorOf picks the second-most-recent, without mutating input", () => {
    const copy = [...snaps];
    expect(priorOf(snaps).recorded_at).toBe("2026-02-01");
    expect(snaps).toEqual(copy);
    expect(priorOf([snaps[0]])).toBeNull();
  });

  it("calcTrend reports delta and direction", () => {
    expect(calcTrend(150, 100)).toEqual({ delta: 50, direction: "up" });
    expect(calcTrend(100, 150)).toEqual({ delta: -50, direction: "down" });
    expect(calcTrend(100, 100)).toEqual({ delta: 0, direction: "flat" });
    expect(calcTrend(100, null)).toBeNull();
  });
});

describe("buildNetWorthHistory", () => {
  const accounts = [
    { id: "a1", type: "asset" },
    { id: "l1", type: "liability" },
  ];

  it("uses the latest snapshot per account per month and carries values forward", () => {
    const snapshots = [
      { account_id: "a1", recorded_at: "2026-01-05", value_cents: 100 },
      { account_id: "a1", recorded_at: "2026-01-20", value_cents: 120 },
      { account_id: "l1", recorded_at: "2026-01-10", value_cents: 30 },
      { account_id: "a1", recorded_at: "2026-03-01", value_cents: 200 },
    ];
    expect(buildNetWorthHistory(accounts, snapshots)).toEqual([
      { month: "2026-01", netWorth: 90 },
      { month: "2026-03", netWorth: 170 },
    ]);
  });

  it("returns [] with no snapshots", () => {
    expect(buildNetWorthHistory(accounts, [])).toEqual([]);
  });

  it("months are sorted oldest-first even when snapshots arrive out of order", () => {
    const snapshots = [
      { account_id: "a1", recorded_at: "2026-05-01", value_cents: 5 },
      { account_id: "a1", recorded_at: "2026-02-01", value_cents: 2 },
    ];
    expect(buildNetWorthHistory(accounts, snapshots).map((h) => h.month)).toEqual(["2026-02", "2026-05"]);
  });
});
