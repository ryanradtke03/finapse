import { describe, it, expect } from "vitest";
import {
  resolveEffectiveCategory,
  buildDetailedCategoryWhere,
  buildExcludeTransfersWhere,
  deriveMerchantKey,
  buildMerchantBackfillWhere,
} from "../transaction.service";

describe("resolveEffectiveCategory", () => {
  const baseRow = {
    id: "t1",
    userCategory: null as string | null,
    personalFinanceCategoryDetail: null as string | null,
    personalFinanceCategory: null as string | null,
  };

  it("prefers an explicit user override above everything else", () => {
    const row = {
      ...baseRow,
      userCategory: "MY_CUSTOM_CATEGORY",
      personalFinanceCategoryDetail: "FOOD_AND_DRINK_COFFEE",
      personalFinanceCategory: "FOOD_AND_DRINK",
    };
    // Even if the row is also in the recurring set, override still wins.
    expect(resolveEffectiveCategory(row, new Set([row.id]))).toBe("MY_CUSTOM_CATEGORY");
  });

  it("falls back to the recurring/subscription heuristic when there's no override", () => {
    const row = {
      ...baseRow,
      personalFinanceCategoryDetail: "ENTERTAINMENT_TV_AND_MOVIES",
      personalFinanceCategory: "ENTERTAINMENT",
    };
    expect(resolveEffectiveCategory(row, new Set([row.id]))).toBe("SUBSCRIPTION");
  });

  it("falls back to the detailed Plaid category when not an override or recurring", () => {
    const row = {
      ...baseRow,
      personalFinanceCategoryDetail: "FOOD_AND_DRINK_COFFEE",
      personalFinanceCategory: "FOOD_AND_DRINK",
    };
    expect(resolveEffectiveCategory(row, new Set())).toBe("FOOD_AND_DRINK_COFFEE");
  });

  it("falls back to the primary Plaid category when detail is missing", () => {
    const row = {
      ...baseRow,
      personalFinanceCategoryDetail: null,
      personalFinanceCategory: "FOOD_AND_DRINK",
    };
    expect(resolveEffectiveCategory(row, new Set())).toBe("FOOD_AND_DRINK");
  });

  it("falls back to UNCATEGORIZED when nothing is set", () => {
    expect(resolveEffectiveCategory(baseRow, new Set())).toBe("UNCATEGORIZED");
  });
});

describe("buildDetailedCategoryWhere", () => {
  it("returns an empty where clause for an empty category list", () => {
    expect(buildDetailedCategoryWhere([], new Set())).toEqual({});
  });

  it("builds an id-in filter for the SUBSCRIPTION sentinel, sourced from recurringIds", () => {
    const recurringIds = new Set(["a", "b"]);
    const where = buildDetailedCategoryWhere(["SUBSCRIPTION"], recurringIds);
    expect(where).toEqual({
      OR: [{ id: { in: expect.arrayContaining(["a", "b"]) } }],
    });
    const idFilter = (where as { OR: Array<{ id: { in: string[] } }> }).OR[0].id;
    expect(idFilter.in).toHaveLength(2);
  });

  it("builds a userCategory / detail / primary-fallback OR clause for a normal category value", () => {
    const where = buildDetailedCategoryWhere(["FOOD_AND_DRINK_COFFEE"], new Set());
    expect(where).toEqual({
      OR: [
        {
          OR: [
            { userCategory: "FOOD_AND_DRINK_COFFEE" },
            { userCategory: null, personalFinanceCategoryDetail: "FOOD_AND_DRINK_COFFEE" },
            { userCategory: null, personalFinanceCategory: "FOOD_AND_DRINK_COFFEE" },
          ],
        },
      ],
    });
  });

  it("still matches legacy primary-level budget values via the primary-fallback branch", () => {
    // Old budgets stored a primary-level value like "FOOD_AND_DRINK" before
    // detailed categories existed. The same where-builder has to keep
    // matching every detailed row under that bucket.
    const where = buildDetailedCategoryWhere(["FOOD_AND_DRINK"], new Set());
    const orClause = where.OR as Array<Record<string, unknown>>;
    expect(orClause[0].OR).toContainEqual({
      userCategory: null,
      personalFinanceCategory: "FOOD_AND_DRINK",
    });
  });

  it("combines multiple categories with a top-level OR", () => {
    const where = buildDetailedCategoryWhere(
      ["FOOD_AND_DRINK_COFFEE", "SUBSCRIPTION"],
      new Set(["x"]),
    );
    const orClause = where.OR as unknown[];
    expect(orClause).toHaveLength(2);
  });
});

describe("deriveMerchantKey", () => {
  it("prefers the Plaid merchant entity id", () => {
    expect(
      deriveMerchantKey({
        merchantEntityId: "abc123",
        merchantName: "Joe's",
        name: "JOES COFFEE",
      }),
    ).toBe("entity:abc123");
  });

  it("falls back to a normalized (lowercased, trimmed) merchant name", () => {
    expect(
      deriveMerchantKey({
        merchantEntityId: null,
        merchantName: "  Joe's Coffee  ",
        name: "SQ *JOES 123",
      }),
    ).toBe("name:joe's coffee");
  });

  it("falls back to the raw name when there's no merchant name (sandbox rows)", () => {
    expect(
      deriveMerchantKey({
        merchantEntityId: null,
        merchantName: null,
        name: "8OZ POKE",
      }),
    ).toBe("name:8oz poke");
  });

  it("returns null when there's nothing to key on", () => {
    expect(
      deriveMerchantKey({
        merchantEntityId: null,
        merchantName: null,
        name: null,
      }),
    ).toBeNull();
    expect(
      deriveMerchantKey({
        merchantEntityId: null,
        merchantName: "   ",
        name: "   ",
      }),
    ).toBeNull();
  });
});

describe("buildMerchantBackfillWhere", () => {
  it("keeps BOTH the merchant filter and the source guard (regression: dup OR)", () => {
    const where = buildMerchantBackfillWhere("u1", "name:8oz poke", "origin-id");

    // Must exclude the origin row.
    expect(where.id).toEqual({ not: "origin-id" });

    // The merchant match and the "only untouched rows" guard must both survive,
    // combined under AND — not collapsed into a single OR that matches all rows.
    const and = where.AND as Array<Record<string, unknown>>;
    expect(Array.isArray(and)).toBe(true);
    expect(and).toHaveLength(2);

    const merchantClause = and[0];
    expect(merchantClause.merchantEntityId).toBeNull();
    expect(merchantClause.OR).toEqual([
      { merchantName: { equals: "8oz poke", mode: "insensitive" } },
      { merchantName: null, name: { equals: "8oz poke", mode: "insensitive" } },
    ]);

    const sourceGuard = and[1];
    expect(sourceGuard.OR).toEqual([
      { categorySource: null },
      { categorySource: "MERCHANT_RULE" },
    ]);
  });

  it("matches by entity id when the key is entity-scoped", () => {
    const where = buildMerchantBackfillWhere("u1", "entity:abc123", "origin-id");
    const and = where.AND as Array<Record<string, unknown>>;
    expect(and[0]).toEqual({ merchantEntityId: "abc123" });
  });
});

describe("buildExcludeTransfersWhere", () => {
  it("excludes transfer primaries and card payments only when there's no user override", () => {
    expect(buildExcludeTransfersWhere()).toEqual({
      NOT: {
        userCategory: null,
        OR: [
          { personalFinanceCategory: { in: ["TRANSFER_IN", "TRANSFER_OUT"] } },
          {
            personalFinanceCategoryDetail: {
              in: ["LOAN_PAYMENTS_CREDIT_CARD_PAYMENT"],
            },
          },
        ],
      },
    });
  });
});
