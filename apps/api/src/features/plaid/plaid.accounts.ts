// ─────────────────────────────────────────
// Which accounts Finapse actually models
// ─────────────────────────────────────────
//
// Plaid's Sandbox institution returns a dozen accounts on every link — CDs,
// IRAs, 401ks, HSAs, mortgages, student loans, cash management, business
// cards. Finapse has no UI or maths for any of them: the dashboard totals,
// budgets and recurring detection are all built around everyday cash flow, so
// a $65k student loan just lands in Total Balance as noise. The product is
// aimed at someone who banks with a debit card and a credit card, and the demo
// should look like that person's finances, not a full balance sheet.
//
// So the app takes a position: an account is stored only if it's one of the
// kinds below. Filtering happens at the Plaid boundary (exchangePublicToken
// and syncTransactions) rather than in the UI, so an unsupported account never
// enters the DB in the first place — no row to hide, and nothing for the next
// sync to resurrect.

export const SUPPORTED_ACCOUNT_SUBTYPES: Readonly<
  Record<string, readonly string[]>
> = {
  depository: ["checking", "savings"],
  credit: ["credit card"],
};

type AccountShape = {
  type: string;
  subtype?: string | null;
  name?: string;
};

export function isSupportedAccount(account: AccountShape): boolean {
  const allowed = SUPPORTED_ACCOUNT_SUBTYPES[account.type];
  if (!allowed) return false;
  return account.subtype != null && allowed.includes(account.subtype);
}

/**
 * Keep only the accounts Finapse models, logging what was dropped so a
 * "where did my mortgage go" report is answerable from the server logs.
 */
export function filterSupportedAccounts<T extends AccountShape>(
  accounts: T[],
  context: string,
): T[] {
  const supported = accounts.filter(isSupportedAccount);

  const dropped = accounts.length - supported.length;
  if (dropped > 0) {
    console.log(
      `[${context}] skipping ${dropped} unsupported account(s)`,
      accounts
        .filter((a) => !isSupportedAccount(a))
        .map((a) => ({ name: a.name, type: a.type, subtype: a.subtype })),
    );
  }

  return supported;
}
