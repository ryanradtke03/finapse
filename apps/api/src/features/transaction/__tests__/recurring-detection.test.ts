import { describe, it, expect } from "vitest";
import {
  computeRecurringIds,
  type RecurringCandidateRow,
} from "../transaction.service";

// Builds a candidate row with sane defaults so each test only spells out the
// fields it actually cares about.
function row(
  overrides: Partial<RecurringCandidateRow> & { id: string },
): RecurringCandidateRow {
  return {
    accountId: "acct-1",
    merchantName: null,
    name: "Test Merchant",
    date: new Date("2026-01-01"),
    amount: 10,
    personalFinanceCategory: "ENTERTAINMENT",
    ...overrides,
  };
}

describe("computeRecurringIds", () => {
  it("flags a clean 4-month subscription chain (Netflix-style)", () => {
    const rows = [
      row({ id: "n1", merchantName: "Netflix", date: new Date("2026-01-05"), amount: 15.99 }),
      row({ id: "n2", merchantName: "Netflix", date: new Date("2026-02-04"), amount: 15.99 }),
      row({ id: "n3", merchantName: "Netflix", date: new Date("2026-03-06"), amount: 15.99 }),
      row({ id: "n4", merchantName: "Netflix", date: new Date("2026-04-03"), amount: 15.99 }),
    ];
    expect(computeRecurringIds(rows)).toEqual(new Set(["n1", "n2", "n3", "n4"]));
  });

  it("flags a 3-month utility bill in a different eligible category (Comcast-style)", () => {
    const rows = [
      row({ id: "c1", merchantName: "Comcast", personalFinanceCategory: "RENT_AND_UTILITIES", date: new Date("2026-01-10"), amount: 79.99 }),
      row({ id: "c2", merchantName: "Comcast", personalFinanceCategory: "RENT_AND_UTILITIES", date: new Date("2026-02-09"), amount: 79.99 }),
      row({ id: "c3", merchantName: "Comcast", personalFinanceCategory: "RENT_AND_UTILITIES", date: new Date("2026-03-11"), amount: 79.99 }),
    ];
    expect(computeRecurringIds(rows)).toEqual(new Set(["c1", "c2", "c3"]));
  });

  it("does not flag a same-cadence, same-amount purchase in an ineligible category (Starbucks-style)", () => {
    const rows = [
      row({ id: "s1", merchantName: "Starbucks", personalFinanceCategory: "FOOD_AND_DRINK", date: new Date("2026-01-05"), amount: 6.5 }),
      row({ id: "s2", merchantName: "Starbucks", personalFinanceCategory: "FOOD_AND_DRINK", date: new Date("2026-02-04"), amount: 6.5 }),
      row({ id: "s3", merchantName: "Starbucks", personalFinanceCategory: "FOOD_AND_DRINK", date: new Date("2026-03-06"), amount: 6.5 }),
    ];
    expect(computeRecurringIds(rows).size).toBe(0);
  });

  it("does not flag recurring payroll deposits (INCOME is not an eligible category)", () => {
    const rows = [
      row({ id: "p1", merchantName: "Acme Corp Payroll", personalFinanceCategory: "INCOME", date: new Date("2026-01-15"), amount: -3200 }),
      row({ id: "p2", merchantName: "Acme Corp Payroll", personalFinanceCategory: "INCOME", date: new Date("2026-02-14"), amount: -3200 }),
      row({ id: "p3", merchantName: "Acme Corp Payroll", personalFinanceCategory: "INCOME", date: new Date("2026-03-16"), amount: -3200 }),
    ];
    expect(computeRecurringIds(rows).size).toBe(0);
  });

  it("does not flag only 2 occurrences, even in an eligible category (Planet Fitness-style)", () => {
    const rows = [
      row({ id: "g1", merchantName: "Planet Fitness", personalFinanceCategory: "PERSONAL_CARE", date: new Date("2026-01-01"), amount: 24.99 }),
      row({ id: "g2", merchantName: "Planet Fitness", personalFinanceCategory: "PERSONAL_CARE", date: new Date("2026-02-01"), amount: 24.99 }),
    ];
    expect(computeRecurringIds(rows).size).toBe(0);
  });

  it("only flags the run that stays chained after a price jump breaks the tolerance (Spotify-style)", () => {
    const rows = [
      row({ id: "sp1", merchantName: "Spotify", date: new Date("2026-01-05"), amount: 9.99 }),
      row({ id: "sp2", merchantName: "Spotify", date: new Date("2026-02-04"), amount: 9.99 }),
      row({ id: "sp3", merchantName: "Spotify", date: new Date("2026-03-06"), amount: 15.99 }), // >3% jump vs sp2
      row({ id: "sp4", merchantName: "Spotify", date: new Date("2026-04-05"), amount: 15.99 }),
      row({ id: "sp5", merchantName: "Spotify", date: new Date("2026-05-05"), amount: 15.99 }),
    ];
    // sp1-sp2 is an isolated qualifying pair (run length 1) so it's left
    // unflagged; sp3-sp4-sp5 forms its own run of 2 consecutive qualifying
    // pairs at the new price, so that run is flagged.
    expect(computeRecurringIds(rows)).toEqual(new Set(["sp3", "sp4", "sp5"]));
  });

  it("never merges the same merchant/amount across two different accounts", () => {
    const rows = [
      row({ id: "d1", accountId: "chase", merchantName: "Duplicate Co", date: new Date("2026-01-01"), amount: 20 }),
      row({ id: "d2", accountId: "chase", merchantName: "Duplicate Co", date: new Date("2026-02-01"), amount: 20 }),
      row({ id: "d3", accountId: "bofa", merchantName: "Duplicate Co", date: new Date("2026-01-15"), amount: 20 }),
      row({ id: "d4", accountId: "bofa", merchantName: "Duplicate Co", date: new Date("2026-02-14"), amount: 20 }),
    ];
    // 2 occurrences per account, grouped separately by accountId — neither
    // group reaches the 3-occurrence minimum, and they can't combine across
    // accounts to fake reaching it.
    expect(computeRecurringIds(rows).size).toBe(0);
  });

  it("ignores rows with no personalFinanceCategory at all", () => {
    const rows = [
      row({ id: "u1", personalFinanceCategory: null, date: new Date("2026-01-01") }),
      row({ id: "u2", personalFinanceCategory: null, date: new Date("2026-02-01") }),
      row({ id: "u3", personalFinanceCategory: null, date: new Date("2026-03-01") }),
    ];
    expect(computeRecurringIds(rows).size).toBe(0);
  });

  it("falls back to name when merchantName is null, matching case/whitespace-insensitively", () => {
    const rows = [
      row({ id: "m1", merchantName: null, name: " netflix.com ", date: new Date("2026-01-05"), amount: 15.99 }),
      row({ id: "m2", merchantName: null, name: "NETFLIX.COM", date: new Date("2026-02-04"), amount: 15.99 }),
      row({ id: "m3", merchantName: null, name: "Netflix.com", date: new Date("2026-03-06"), amount: 15.99 }),
    ];
    expect(computeRecurringIds(rows)).toEqual(new Set(["m1", "m2", "m3"]));
  });
});
