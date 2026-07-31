# Testing

## Unit tests (apps/api)

Vitest, wired up via `apps/api/package.json`'s `test` script (also reachable from the repo
root as `npm run test`). Test files live next to the code they cover, under `__tests__/`:

- `src/features/transaction/__tests__/recurring-detection.test.ts` — covers
  `computeRecurringIds`, the pure function behind the subscription-detection heuristic
  (`getRecurringTransactionIds` is a thin Prisma-fetching wrapper around it). Exercises the
  same scenarios as `sandbox-test-data.json` below: true-positive chains, the category
  eligibility gate, the 3-occurrence minimum, a mid-chain amount-tolerance break, and
  cross-account isolation.
- `src/features/transaction/__tests__/category-resolution.test.ts` — covers
  `resolveEffectiveCategory` (override > subscription > detail > primary precedence) and
  `buildDetailedCategoryWhere` (the SUBSCRIPTION sentinel branch and the legacy
  primary-category fallback).

Run with:

```bash
cd apps/api && npm run test        # single run
cd apps/api && npm run test:watch  # watch mode
```

These functions were deliberately kept pure (plain objects/arrays in, no Prisma calls) and
exported specifically so they're testable without a live database — `vitest.config.ts` sets
a dummy `DATABASE_URL` only so importing `transaction.service.ts` doesn't throw at
`src/db/prisma.ts`'s module-load-time env check; no real connection is ever made.

## Plaid Sandbox custom test user

Plaid's default Sandbox test user (`user_good` / `pass_good`) gives every developer the
same small, repetitive canned dataset. That's fine for a quick smoke test, but it's bad
for testing anything data-dependent — e.g. the recurring/subscription-detection heuristic
in `apps/api/src/features/transaction/transaction.service.ts` (`getRecurringTransactionIds`),
where the default data's repetitiveness produces coincidental false positives that have
nothing to do with real subscription behavior.

Instead, use a **custom Sandbox user** with a deliberately-designed dataset.

### The config

Lives at [`apps/api/sandbox-test-data.json`](../apps/api/sandbox-test-data.json). Safe to
commit — it's fake Sandbox-only data, no real credentials or secrets. Covers:

- A clean recurring subscription (Netflix, 4 months, exact amount) — should flag as Subscription.
- A second recurring subscription in a different eligible category (Comcast, Rent & Utilities).
- A subscription whose price changes partway through (Spotify) — exercises the amount-tolerance
  edge case; may or may not flag depending on how the run-detection handles the break.
- A same-cadence, same-amount, *ineligible-category* lookalike (Starbucks, Food & Drink) —
  must NOT flag, tests the category gate.
- Recurring payroll (Income) — same shape as a subscription, must NOT flag either.
- A right-category pair with only 2 occurrences (Planet Fitness) — must NOT flag, tests
  the "need 3, not 2" rule.
- A handful of one-off purchases across categories, for Dashboard/Budgets variety.
- One transaction posted in the future, to produce a pending transaction.

### Username

Saved in the Plaid Dashboard (Developers → Sandbox → Sandbox Users →
[dashboard.plaid.com/developers/sandbox?tab=testUsers](https://dashboard.plaid.com/developers/sandbox?tab=testUsers))
as:

- **Name** (dashboard label only): `Finapse — Recurring Test Data`
- **Username**: `custom_recurring_test` (Plaid prefixes custom Sandbox usernames with
  `custom_` automatically — the Dashboard field only takes the part after that)
- **JSON config**: contents of `sandbox-test-data.json`, pasted in as-is

This makes it reusable — link against `custom_recurring_test` + any non-empty password any
time you need this dataset again, without re-pasting JSON.

For a one-off test without touching the Dashboard: in Plaid Link, use username `user_custom`
and paste the entire JSON config as the password field instead.

Either way, pick any non-OAuth Sandbox institution in Link (First Platypus Bank is the one
Plaid's own docs use as the default example).

### Adding more scenarios

Edit `sandbox-test-data.json` directly — `transactions[]` entries just need
`date_transacted` / `date_posted` / `amount` / `description` / `currency`. Plaid infers
`merchant_name` and `personal_finance_category` from the `description` text using its own
categorization model, so use realistic merchant-style strings ("NETFLIX.COM", not
"Netflix subscription"). There's no field to force a category directly.
