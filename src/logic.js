/**
 * Pure calculation and formatting helpers for the Nest Egg app.
 * No DOM, no fetch — safe to unit-test in Node.
 */

const CATEGORY_ICONS = {
  home:              "🏠",
  investment:        "📈",
  savings:           "💰",
  checking:          "🏦",
  vehicle:           "🚗",
  other_asset:       "💎",
  mortgage:          "🏠",
  auto_loan:         "🚗",
  student_loan:      "🎓",
  credit_card:       "💳",
  other_liability:   "📋",
};

const CATEGORY_LABELS = {
  home:              "Home / Property",
  investment:        "Investment / Retirement",
  savings:           "Savings Account",
  checking:          "Checking Account",
  vehicle:           "Vehicle",
  other_asset:       "Other Asset",
  mortgage:          "Mortgage",
  auto_loan:         "Auto Loan",
  student_loan:      "Student Loan",
  credit_card:       "Credit Card",
  other_liability:   "Other Liability",
};

export function categoryIcon(category) {
  return CATEGORY_ICONS[category] ?? "💼";
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * Calculate net worth from a list of accounts, each with a `latestCents` property.
 * Returns { assets, liabilities, netWorth } all in cents.
 */
export function calcNetWorth(accounts) {
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    const v = a.latestCents ?? 0;
    if (a.type === "asset") assets += v;
    else liabilities += v;
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}

/**
 * Returns progress as a number 0–1, or null if target is falsy.
 */
export function calcProgress(currentCents, targetCents) {
  if (!targetCents || targetCents <= 0) return null;
  return Math.min(currentCents / targetCents, 1);
}

/**
 * Format a date string (ISO or YYYY-MM-DD) as "Jan 2025".
 */
export function fmtMonthYear(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate.length > 10 ? isoDate : isoDate + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return isoDate;
  }
}

/**
 * Format a date string as "May 24, 2025".
 */
export function fmtDate(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate.length > 10 ? isoDate : isoDate + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoDate;
  }
}

/**
 * Given an array of snapshots with a recorded_at field, return the most recent one.
 */
export function latestOf(snapshots) {
  if (!snapshots || snapshots.length === 0) return null;
  return snapshots.reduce((a, b) => (a.recorded_at > b.recorded_at ? a : b));
}

/**
 * Given an array of snapshots, return the second-most-recent one (for trend comparison).
 */
export function priorOf(snapshots) {
  if (!snapshots || snapshots.length < 2) return null;
  const sorted = [...snapshots].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  return sorted[1];
}

/**
 * Describe the change from priorCents to currentCents.
 * Returns { delta, direction: 'up'|'down'|'flat' }.
 * Callers format delta using fmtMoney from hub-sdk.js.
 */
export function calcTrend(currentCents, priorCents) {
  if (priorCents == null) return null;
  const delta = currentCents - priorCents;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { delta, direction };
}

/**
 * Build net worth history from account snapshots.
 * Returns an array of { month: "2025-01", netWorth } sorted oldest-first,
 * using the latest snapshot per account per calendar month.
 */
export function buildNetWorthHistory(accounts, allSnapshots) {
  const snapshotsByAccount = {};
  for (const s of allSnapshots) {
    if (!snapshotsByAccount[s.account_id]) snapshotsByAccount[s.account_id] = [];
    snapshotsByAccount[s.account_id].push(s);
  }

  // Collect all months that appear in snapshots
  const monthSet = new Set();
  for (const s of allSnapshots) {
    monthSet.add(s.recorded_at.slice(0, 7)); // "YYYY-MM"
  }
  const months = [...monthSet].sort();

  return months.map(month => {
    let assets = 0;
    let liabilities = 0;
    for (const acct of accounts) {
      const snaps = (snapshotsByAccount[acct.id] ?? []).filter(s => s.recorded_at.slice(0, 7) <= month);
      const latest = latestOf(snaps);
      if (latest) {
        if (acct.type === "asset") assets += latest.value_cents;
        else liabilities += latest.value_cents;
      }
    }
    return { month, netWorth: assets - liabilities };
  });
}
