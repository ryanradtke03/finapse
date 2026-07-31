import { describe, it, expect } from "vitest";
import {
  resolveEffectiveCategory,
  buildDetailedCategoryWhere,
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
