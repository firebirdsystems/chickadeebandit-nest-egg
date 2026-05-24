import { describe, it, expect } from "vitest";
import {
  calcNetWorth,
  calcProgress,
  fmtMonthYear,
  fmtDate,
  latestOf,
  priorOf,
  calcTrend,
  buildNetWorthHistory,
  categoryIcon,
  categoryLabel,
} from "../src/logic.js";

describe("calcNetWorth", () => {
  it("sums assets minus liabilities", () => {
    const accounts = [
      { type: "asset",     latestCents: 45000000 }, // $450K home
      { type: "asset",     latestCents:  8500000 }, // $85K 401k
      { type: "liability", latestCents: 32000000 }, // $320K mortgage
    ];
    const { assets, liabilities, netWorth } = calcNetWorth(accounts);
    expect(assets).toBe(53500000);
    expect(liabilities).toBe(32000000);
    expect(netWorth).toBe(21500000);
  });

  it("handles empty list", () => {
    const { assets, liabilities, netWorth } = calcNetWorth([]);
    expect(assets).toBe(0);
    expect(liabilities).toBe(0);
    expect(netWorth).toBe(0);
  });

  it("handles accounts with no latestCents (treats as 0)", () => {
    const accounts = [{ type: "asset", latestCents: undefined }];
    expect(calcNetWorth(accounts).netWorth).toBe(0);
  });

  it("produces negative net worth when liabilities exceed assets", () => {
    const accounts = [
      { type: "asset",     latestCents: 1000 },
      { type: "liability", latestCents: 5000 },
    ];
    expect(calcNetWorth(accounts).netWorth).toBe(-4000);
  });
});

describe("calcProgress", () => {
  it("returns 0–1 fraction", () => {
    expect(calcProgress(5000, 10000)).toBe(0.5);
    expect(calcProgress(10000, 10000)).toBe(1);
    expect(calcProgress(0, 10000)).toBe(0);
  });

  it("caps at 1 when current exceeds target", () => {
    expect(calcProgress(15000, 10000)).toBe(1);
  });

  it("returns null when target is falsy", () => {
    expect(calcProgress(5000, 0)).toBeNull();
    expect(calcProgress(5000, null)).toBeNull();
    expect(calcProgress(5000, undefined)).toBeNull();
  });
});

describe("fmtMonthYear", () => {
  it("formats ISO datetime as month + year", () => {
    expect(fmtMonthYear("2025-01-15T00:00:00")).toBe("Jan 2025");
  });

  it("formats YYYY-MM-DD as month + year", () => {
    expect(fmtMonthYear("2025-06-01")).toBe("Jun 2025");
  });

  it("returns empty string for falsy", () => {
    expect(fmtMonthYear(null)).toBe("");
    expect(fmtMonthYear("")).toBe("");
  });
});

describe("fmtDate", () => {
  it("formats to readable date", () => {
    expect(fmtDate("2025-05-24T00:00:00")).toBe("May 24, 2025");
  });
});

describe("latestOf / priorOf", () => {
  const snapshots = [
    { id: "a", recorded_at: "2025-01-01T00:00:00", value_cents: 100 },
    { id: "b", recorded_at: "2025-03-01T00:00:00", value_cents: 200 },
    { id: "c", recorded_at: "2025-02-01T00:00:00", value_cents: 150 },
  ];

  it("latestOf returns most recent snapshot", () => {
    expect(latestOf(snapshots).id).toBe("b");
  });

  it("latestOf returns null for empty array", () => {
    expect(latestOf([])).toBeNull();
  });

  it("priorOf returns second most recent snapshot", () => {
    expect(priorOf(snapshots).id).toBe("c");
  });

  it("priorOf returns null when fewer than 2 snapshots", () => {
    expect(priorOf([snapshots[0]])).toBeNull();
  });
});

describe("calcTrend", () => {
  it("reports upward trend", () => {
    const t = calcTrend(30000, 25000);
    expect(t.direction).toBe("up");
    expect(t.delta).toBe(5000);
  });

  it("reports downward trend", () => {
    const t = calcTrend(20000, 25000);
    expect(t.direction).toBe("down");
    expect(t.delta).toBe(-5000);
  });

  it("reports flat when unchanged", () => {
    const t = calcTrend(25000, 25000);
    expect(t.direction).toBe("flat");
    expect(t.delta).toBe(0);
  });

  it("returns null when prior is null", () => {
    expect(calcTrend(25000, null)).toBeNull();
  });
});

describe("buildNetWorthHistory", () => {
  it("aggregates net worth per month", () => {
    const accounts = [
      { id: "a1", type: "asset" },
      { id: "l1", type: "liability" },
    ];
    const snapshots = [
      { id: "s1", account_id: "a1", recorded_at: "2025-01-10T00:00:00", value_cents: 100000 },
      { id: "s2", account_id: "l1", recorded_at: "2025-01-10T00:00:00", value_cents:  40000 },
      { id: "s3", account_id: "a1", recorded_at: "2025-02-05T00:00:00", value_cents: 110000 },
      { id: "s4", account_id: "l1", recorded_at: "2025-02-05T00:00:00", value_cents:  38000 },
    ];
    const history = buildNetWorthHistory(accounts, snapshots);
    expect(history.length).toBe(2);
    expect(history[0]).toMatchObject({ month: "2025-01", netWorth: 60000 });
    expect(history[1]).toMatchObject({ month: "2025-02", netWorth: 72000 });
  });

  it("uses latest snapshot within a month for each account", () => {
    const accounts = [{ id: "a1", type: "asset" }];
    const snapshots = [
      { id: "s1", account_id: "a1", recorded_at: "2025-01-05T00:00:00", value_cents: 100 },
      { id: "s2", account_id: "a1", recorded_at: "2025-01-20T00:00:00", value_cents: 200 },
    ];
    const history = buildNetWorthHistory(accounts, snapshots);
    expect(history[0].netWorth).toBe(200);
  });

  it("only creates entries for months that appear in snapshots", () => {
    const accounts = [{ id: "a1", type: "asset" }];
    const snapshots = [
      { id: "s1", account_id: "a1", recorded_at: "2025-01-10T00:00:00", value_cents: 500 },
      { id: "s2", account_id: "a1", recorded_at: "2025-03-10T00:00:00", value_cents: 600 },
    ];
    const history = buildNetWorthHistory(accounts, snapshots);
    // Only Jan and Mar appear (no Feb snapshot)
    expect(history.map(h => h.month)).toEqual(["2025-01", "2025-03"]);
    expect(history[0].netWorth).toBe(500);
    expect(history[1].netWorth).toBe(600);
  });
});

describe("categoryIcon / categoryLabel", () => {
  it("returns known icons", () => {
    expect(categoryIcon("home")).toBe("🏠");
    expect(categoryIcon("mortgage")).toBe("🏠");
    expect(categoryIcon("investment")).toBe("📈");
    expect(categoryIcon("credit_card")).toBe("💳");
  });

  it("returns fallback icon for unknown category", () => {
    expect(categoryIcon("mystery")).toBe("💼");
  });

  it("returns known labels", () => {
    expect(categoryLabel("savings")).toBe("Savings Account");
    expect(categoryLabel("auto_loan")).toBe("Auto Loan");
  });
});
