-- Accounts: assets and liabilities tracked by the household
CREATE TABLE IF NOT EXISTS accounts (
  household_id  UUID    NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  category      TEXT    NOT NULL, -- home | investment | savings | checking | vehicle | other_asset | mortgage | auto_loan | student_loan | credit_card | other_liability
  type          TEXT    NOT NULL, -- asset | liability
  archived_at   TEXT,
  created_at    TEXT    NOT NULL,
  PRIMARY KEY (household_id, id)
);

-- Account snapshots: value at a point in time (one row per manual update)
CREATE TABLE IF NOT EXISTS account_snapshots (
  household_id  UUID    NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT    NOT NULL,
  account_id    TEXT    NOT NULL,
  value_cents   INTEGER NOT NULL,
  note          TEXT    NOT NULL DEFAULT '',
  recorded_by   TEXT    NOT NULL,
  recorded_at   TEXT    NOT NULL,
  PRIMARY KEY (household_id, id)
);

-- Funds: named special-purpose funds (emergency fund, HOA reserve, vacation, etc.)
CREATE TABLE IF NOT EXISTS funds (
  household_id  UUID    NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  target_cents  INTEGER,          -- null = no target
  archived_at   TEXT,
  created_at    TEXT    NOT NULL,
  PRIMARY KEY (household_id, id)
);

-- Fund snapshots: fund balance at a point in time
CREATE TABLE IF NOT EXISTS fund_snapshots (
  household_id  UUID    NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT    NOT NULL,
  fund_id       TEXT    NOT NULL,
  balance_cents INTEGER NOT NULL,
  note          TEXT    NOT NULL DEFAULT '',
  recorded_by   TEXT    NOT NULL,
  recorded_at   TEXT    NOT NULL,
  PRIMARY KEY (household_id, id)
);

-- Savings goals: per-member goals with optional kid visibility
CREATE TABLE IF NOT EXISTS savings_goals (
  household_id  UUID    NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT    NOT NULL,
  member_id     TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  target_cents  INTEGER NOT NULL,
  target_date   TEXT,             -- ISO date, optional
  visibility    TEXT    NOT NULL DEFAULT 'adults', -- adults | everyone
  achieved_at   TEXT,
  created_at    TEXT    NOT NULL,
  PRIMARY KEY (household_id, id)
);

-- Goal snapshots: savings goal progress over time
CREATE TABLE IF NOT EXISTS goal_snapshots (
  household_id  UUID    NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id            TEXT    NOT NULL,
  goal_id       TEXT    NOT NULL,
  balance_cents INTEGER NOT NULL,
  note          TEXT    NOT NULL DEFAULT '',
  recorded_by   TEXT    NOT NULL,
  recorded_at   TEXT    NOT NULL,
  PRIMARY KEY (household_id, id)
);
