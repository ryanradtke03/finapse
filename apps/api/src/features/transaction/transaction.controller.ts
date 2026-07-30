import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  getDistinctCategories,
  getTransactionById,
  getTransactionsList,
  getTransactionSummary,
  updateTransactionCategory,
} from "./transaction.service";

// Express parses repeated query keys (?category=a&category=b) into an
// array, but a single occurrence (?category=a) into a plain string —
// normalize both into an array.
function parseCategoryParam(value: unknown): string[] | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? (value as string[]) : [value as string];
}

export async function getTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { accountId, startDate, endDate, search, category, limit, cursor } =
      req.query;

    const result = await getTransactionsList({
      userId: req.user!.id,
      accountId: accountId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      search: search as string | undefined,
      category: parseCategoryParam(category),
      limit: limit ? Number(limit) : undefined, // query params arrive as strings
      cursor: cursor as string | undefined,
    });

    return res.status(200).json(result); // { transactions, nextCursor }
  } catch (err) {
    return next(err);
  }
}

export async function getTransactionCategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categories = await getDistinctCategories(req.user!.id);
    return res.status(200).json({ categories });
  } catch (err) {
    return next(err);
  }
}

const updateCategorySchema = z.object({
  category: z.string().min(1).nullable(),
});

export async function updateTransactionCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        Object.assign(new Error("Invalid request body"), { status: 400 }),
      );
    }

    const transaction = await updateTransactionCategory(
      userId,
      id,
      parsed.data.category,
    );

    return res.status(200).json({ transaction });
  } catch (err) {
    return next(err);
  }
}

export async function getTransactionByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const transaction = await getTransactionById(userId, id);

    return res.status(200).json({ transaction });
  } catch (err) {
    return next(err);
  }
}

export async function getTransactionSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, accountId, category } = req.query;

    const params = {
      userId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      accountId: accountId as string | undefined,
      category: category as string | undefined,
    };

    const summary = await getTransactionSummary(params);

    return res.status(200).json({ summary });
  } catch (err) {
    return next(err);
  }
}
