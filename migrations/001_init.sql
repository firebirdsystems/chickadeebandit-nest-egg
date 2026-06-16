-- Accounts: assets and liabilities tracked by the household
CREATE TABLE IF NOT EXISTS app_nest_egg__accounts (
  id            TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  category      TEXT    NOT NULL, -- home | investment | savings | checking | vehicle | other_asset | mortgage | auto_loan | student_loan | credit_card | other_liability
  type          TEXT    NOT NULL, -- asset | liability
  archived_at   TEXT,
  created_at    TEXT    NOT NULL,
  PRIMARY KEY (id)
);

-- Account snapshots: value at a point in time (one row per manual update)
CREATE TABLE IF NOT EXISTS app_nest_egg__account_snapshots (
  id            TEXT    NOT NULL,
  account_id    TEXT    NOT NULL,
  value_cents   INTEGER NOT NULL,
  note          TEXT    NOT NULL DEFAULT '',
  recorded_by   TEXT    NOT NULL,
  recorded_at   TEXT    NOT NULL,
  PRIMARY KEY (id)
);

-- Funds: named special-purpose funds (emergency fund, HOA reserve, vacation, etc.)
CREATE TABLE IF NOT EXISTS app_nest_egg__funds (
  id            TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  target_cents  INTEGER,          -- null = no target
  archived_at   TEXT,
  created_at    TEXT    NOT NULL,
  PRIMARY KEY (id)
);

-- Fund snapshots: fund balance at a point in time
CREATE TABLE IF NOT EXISTS app_nest_egg__fund_snapshots (
  id            TEXT    NOT NULL,
  fund_id       TEXT    NOT NULL,
  balance_cents INTEGER NOT NULL,
  note          TEXT    NOT NULL DEFAULT '',
  recorded_by   TEXT    NOT NULL,
  recorded_at   TEXT    NOT NULL,
  PRIMARY KEY (id)
);

-- Savings goals: per-member goals with optional kid visibility
CREATE TABLE IF NOT EXISTS app_nest_egg__savings_goals (
  id            TEXT    NOT NULL,
  member_id     TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  target_cents  INTEGER NOT NULL,
  target_date   TEXT,             -- ISO date, optional
  visibility    TEXT    NOT NULL DEFAULT 'adults', -- adults | everyone
  achieved_at   TEXT,
  created_at    TEXT    NOT NULL,
  PRIMARY KEY (id)
);

-- Goal snapshots: savings goal progress over time
CREATE TABLE IF NOT EXISTS app_nest_egg__goal_snapshots (
  id            TEXT    NOT NULL,
  goal_id       TEXT    NOT NULL,
  balance_cents INTEGER NOT NULL,
  note          TEXT    NOT NULL DEFAULT '',
  recorded_by   TEXT    NOT NULL,
  recorded_at   TEXT    NOT NULL,
  PRIMARY KEY (id)
);
