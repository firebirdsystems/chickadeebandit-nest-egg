-- Index the manifest `preload` read, which the hub runs server-side while
-- rendering this app's document — on every launch, for every household.
--
-- Both preload reads filter to the unarchived rows and archives are kept
-- forever, so both scans grew with history rather than with what is in use.
--
-- accounts also orders by type then category. Both are plaintext at rest
-- (SKIP_ENCRYPT_COLS covers them), so they can go in the index and the sort
-- disappears entirely.
--
-- funds orders by `name`, which is NOT plaintext here: this app declares no
-- db_plaintext_columns, so the ORDER BY is sorting ciphertext and produces an
-- arbitrary order that only looks alphabetical. Indexing it would not fix that.
-- The index below covers the filter only; ordering funds by name properly means
-- sorting client-side after decrypt.
CREATE INDEX IF NOT EXISTS app_nest_egg__accounts_archived_idx
  ON app_nest_egg__accounts (archived_at, type, category);
CREATE INDEX IF NOT EXISTS app_nest_egg__funds_archived_idx
  ON app_nest_egg__funds (archived_at);
