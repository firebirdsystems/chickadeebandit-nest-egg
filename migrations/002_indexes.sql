CREATE INDEX IF NOT EXISTS idx_nest_egg_acct_snaps_at  ON app_nest_egg__account_snapshots(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_nest_egg_fund_snaps_at  ON app_nest_egg__fund_snapshots(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_nest_egg_goal_snaps_at  ON app_nest_egg__goal_snapshots(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_nest_egg_goals_member   ON app_nest_egg__savings_goals(member_id);
