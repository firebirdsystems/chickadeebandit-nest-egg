/**
 * goal_snapshots is inherit_visibility with a writer column and no adult
 * bypass, so app SQL can only ever delete the caller's OWN snapshots: once the
 * goal row was gone, another recorder's snapshots were invisible (the EXISTS
 * check fails) AND undeletable by anyone, forever. manifest delete_cascades
 * removes them with the goal, as trusted SQL in the same batch.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));
const schema = readFileSync(join(__dirname, "../migrations/001_init.sql"), "utf-8");

describe("delete_cascades", () => {
  it("declares the goal's snapshots", () => {
    expect(manifest.delete_cascades).toEqual({
      savings_goals: [{ table: "goal_snapshots", foreign_key: "goal_id" }],
    });
  });

  it("the declared table and foreign key exist in the migrations", () => {
    expect(schema).toMatch(/CREATE TABLE IF NOT EXISTS app_nest_egg__goal_snapshots\s*\(/);
    expect(schema).toMatch(/\bgoal_id\b/);
  });

  it("the cascade covers the child the row policy puts out of reach", () => {
    expect(manifest.row_policies.goal_snapshots.kind).toBe("inherit_visibility");
    expect(manifest.row_policies.goal_snapshots.writer_column).toBe("recorded_by");
  });
});
