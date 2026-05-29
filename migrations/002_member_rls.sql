-- Restrict children from viewing household financial data (accounts, funds, balances).
-- Children should only see their own savings goals; all financial account data is adults-only.
--
-- Savings goals: children see only their own goals OR goals with visibility='everyone'.
-- All other tables (accounts, funds, snapshots): children have no access at all.

DROP POLICY IF EXISTS member_access ON accounts;
CREATE POLICY member_access ON accounts
  AS RESTRICTIVE FOR ALL TO hub_app_executor
  USING (
    current_setting('app.member_id', true) = ''
    OR current_setting('app.member_role', true) != 'child'
  );

DROP POLICY IF EXISTS member_access ON account_snapshots;
CREATE POLICY member_access ON account_snapshots
  AS RESTRICTIVE FOR ALL TO hub_app_executor
  USING (
    current_setting('app.member_id', true) = ''
    OR current_setting('app.member_role', true) != 'child'
  );

DROP POLICY IF EXISTS member_access ON funds;
CREATE POLICY member_access ON funds
  AS RESTRICTIVE FOR ALL TO hub_app_executor
  USING (
    current_setting('app.member_id', true) = ''
    OR current_setting('app.member_role', true) != 'child'
  );

DROP POLICY IF EXISTS member_access ON fund_snapshots;
CREATE POLICY member_access ON fund_snapshots
  AS RESTRICTIVE FOR ALL TO hub_app_executor
  USING (
    current_setting('app.member_id', true) = ''
    OR current_setting('app.member_role', true) != 'child'
  );

DROP POLICY IF EXISTS member_access ON savings_goals;
CREATE POLICY member_access ON savings_goals
  AS RESTRICTIVE FOR ALL TO hub_app_executor
  USING (
    current_setting('app.member_id', true) = ''
    OR current_setting('app.member_role', true) != 'child'
    OR member_id = current_setting('app.member_id', true)
    OR visibility = 'everyone'
  );
