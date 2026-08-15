import { describe, expect, it, vi } from "vitest";
import { filterSupportedAccounts, isSupportedAccount } from "../plaid.accounts";

// The twelve accounts Plaid's Sandbox institution returns for `user_good`,
// which is exactly what kept showing up in the demo before the allowlist.
const SANDBOX_ACCOUNTS = [
  { name: "Plaid Checking", type: "depository", subtype: "checking" },
  { name: "Plaid Saving", type: "depository", subtype: "savings" },
  { name: "Plaid CD", type: "depository", subtype: "cd" },
  { name: "Plaid Money Market", type: "depository", subtype: "money market" },
  {
    name: "Plaid Cash Management",
    type: "depository",
    subtype: "cash management",
  },
  { name: "Plaid Credit Card", type: "credit", subtype: "credit card" },
  { name: "Plaid IRA", type: "investment", subtype: "ira" },
  { name: "Plaid 401k", type: "investment", subtype: "401k" },
  { name: "Plaid HSA", type: "investment", subtype: "hsa" },
  { name: "Plaid Student Loan", type: "loan", subtype: "student" },
  { name: "Plaid Mortgage", type: "loan", subtype: "mortgage" },
  { name: "Plaid Business Loan", type: "loan", subtype: "business" },
];

describe("isSupportedAccount", () => {
  it("keeps everyday banking accounts", () => {
    expect(
      isSupportedAccount({ type: "depository", subtype: "checking" }),
    ).toBe(true);
    expect(isSupportedAccount({ type: "depository", subtype: "savings" })).toBe(
      true,
    );
    expect(isSupportedAccount({ type: "credit", subtype: "credit card" })).toBe(
      true,
    );
  });

  it("rejects savings vehicles, investments and loans", () => {
    expect(isSupportedAccount({ type: "depository", subtype: "cd" })).toBe(
      false,
    );
    expect(isSupportedAccount({ type: "investment", subtype: "401k" })).toBe(
      false,
    );
    expect(isSupportedAccount({ type: "loan", subtype: "mortgage" })).toBe(
      false,
    );
  });

  it("rejects an unsupported subtype under a supported type", () => {
    expect(
      isSupportedAccount({ type: "depository", subtype: "money market" }),
    ).toBe(false);
    expect(
      isSupportedAccount({ type: "credit", subtype: "line of credit" }),
    ).toBe(false);
  });

  it("rejects an account with no subtype rather than guessing", () => {
    expect(isSupportedAccount({ type: "depository", subtype: null })).toBe(
      false,
    );
    expect(isSupportedAccount({ type: "depository" })).toBe(false);
  });
});

describe("filterSupportedAccounts", () => {
  it("cuts the Sandbox institution down to the three persona accounts", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const kept = filterSupportedAccounts(SANDBOX_ACCOUNTS, "test");

    expect(kept.map((a) => a.name)).toEqual([
      "Plaid Checking",
      "Plaid Saving",
      "Plaid Credit Card",
    ]);
  });

  it("preserves order and returns everything when all are supported", () => {
    const all = SANDBOX_ACCOUNTS.slice(0, 2);
    expect(filterSupportedAccounts(all, "test")).toEqual(all);
  });
});
