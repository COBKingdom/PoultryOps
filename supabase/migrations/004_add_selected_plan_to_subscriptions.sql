-- =====================================================
-- PoultryOps
-- Migration 004
-- Add selected_plan field to subscriptions
-- =====================================================

-- Add selected_plan field to distinguish between
-- the chosen workspace (selected_plan) and the
-- actual paid plan (plan)
-- Trial is a status, not a plan

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS selected_plan TEXT;

-- Add index for querying by selected_plan
CREATE INDEX IF NOT EXISTS idx_subscriptions_selected_plan 
  ON subscriptions(selected_plan);

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.selected_plan IS 
  'The chosen workspace type (solo, team, business). Used during trial to track intended workspace.';

COMMENT ON COLUMN subscriptions.plan IS 
  'The actual paid plan. Null during trial, set to selected_plan value after first payment.';

COMMENT ON COLUMN subscriptions.status IS 
  'Subscription status: trial, active, expired, cancelled, pending';