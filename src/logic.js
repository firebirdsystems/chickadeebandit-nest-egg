/**
 * Pure calculation and formatting helpers for the Nest Egg app.
 * No DOM, no fetch — safe to unit-test in Node.
 */

const CATEGORY_GLYPHS = {
  home:              "house",
  investment:        "coins",
  savings:           "piggy",
  checking:          "bank",
  vehicle:           "car",
  other_asset:       "sparkles",
  mortgage:          "house",
  auto_loan:         "car",
  student_loan:      "graduation",
  credit_card:       "card",
  other_liability:   "document",
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

export function categoryGlyph(category) {
  return CATEGORY_GLYPHS[category] ?? "toolbox";
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

/**
 * Funds in alphabetical order by name.
 *
 * `name` is encrypted at rest, and app-db encryption uses a fresh random IV per
 * write, so `ORDER BY name` in SQL sorts AES ciphertext — an order that is not
 * alphabetical, and that reshuffles on every write. The queries therefore order
 * by created_at (plaintext via the _at suffix) and the alphabetical order is
 * applied here, after the hub has decrypted the rows.
 *
 * Ties fall back to created_at so the order is stable when two funds share a
 * name, rather than depending on however the rows arrived.
 */
export function sortFunds(funds) {
  return [...funds].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
    || (a.created_at ?? "").localeCompare(b.created_at ?? ""));
}

// The hub's own test for an adult member (hub-sdk `isAdult`), repeated here so
// the role rules below can be unit-tested without the browser-only SDK.
function isAdultMember(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

/**
 * Whether a member may change or delete a savings goal that belongs to someone
 * else. Mirrors the hub's rule for the savings_goals table
 * (owner_or_visibility): any adult in a household, and only the steward in a
 * shared space. An adult who merely takes part in a space can see such a goal
 * but a write to it changes nothing.
 */
export function supervisesGoals(member, { tenantKind = "household", isAdmin = false } = {}) {
  return tenantKind === "household" ? isAdultMember(member) : isAdmin === true;
}

/**
 * Whether a member may create a goal in another member's name. Mirrors the
 * hub's supervisor_assigns_owner grant: every adult in a household, the
 * steward in a shared space, and nobody in a co-parenting space, where one
 * parent never records a goal as the other's. Anyone else's new goal is
 * recorded as their own whatever owner they name.
 */
export function assignsGoalOwner(member, { tenantKind = "household", spaceKind = null, isAdmin = false } = {}) {
  if (tenantKind === "household") return isAdultMember(member);
  return spaceKind !== "coparenting" && isAdmin === true;
}

/** The members a new goal may be created for: everyone, or only the creator. */
export function goalOwnerChoices(members, member, tenant) {
  if (assignsGoalOwner(member, tenant)) return members;
  return members.filter(m => m.id === member?.id);
}

/**
 * Whether a member is offered Update and Delete on a goal. Managing goals is
 * for adults; within that, a goal is writable by its owner and by whoever
 * supervises goals.
 */
export function canEditGoal(goal, member, tenant) {
  return isAdultMember(member) && (goal.member_id === member.id || supervisesGoals(member, tenant));
}
