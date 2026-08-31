-- The funds preload and the app's own read are
--   WHERE archived_at IS NULL ORDER BY created_at
-- and run on every launch. app_nest_egg__funds_archived_idx covers the filter
-- but not the ordering, so the matching rows were sorted in a temp b-tree each
-- time.
--
-- The ordering used to be `ORDER BY name`, which was worse than slow: `name` is
-- encrypted at rest and every write uses a fresh random IV, so it sorted AES
-- ciphertext — not alphabetical, and reshuffling whenever any fund was written.
-- Alphabetical order now happens in sortFunds() in src/logic.js, after the hub
-- decrypts. An index on `name` would not have helped and must not be added.
CREATE INDEX IF NOT EXISTS app_nest_egg__funds_archived_created_idx
  ON app_nest_egg__funds (archived_at, created_at);
