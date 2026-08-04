-- One-off recovery for the merchant-rule back-fill bug that mislabeled every
-- non-manual transaction. Safe to run: it only touches rule-applied rows.
--
-- 1. Revert every transaction that was set by a merchant rule back to
--    "no override" (Plaid/heuristic category). MANUAL edits are left untouched.
UPDATE transactions
SET user_category = NULL, category_source = NULL
WHERE category_source = 'MERCHANT_RULE';

-- 2. Clear all merchant rules so you can re-create them intentionally.
DELETE FROM merchant_category_rules;
