import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  deleteTransaction,
  getDistinctCategories,
  getTransactionById,
  getTransactionsList,
  getTransactionSummary,
  updateTransaction,
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

const updateSchema = z
  .object({
    // `category` maps to the user override (userCategory); null clears it.
    category: z.string().min(1).nullable().optional(),
    notes: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

export async function updateTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        Object.assign(new Error("Invalid request body"), { status: 400 }),
      );
    }

    const { category, notes, tags } = parsed.data;

    const transaction = await updateTransaction(userId, id, {
      ...(category !== undefined && { userCategory: category }),
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags }),
    });

    return res.status(200).json({ transaction });
  } catch (err) {
    return next(err);
  }
}

export async function deleteTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await deleteTransaction(userId, id);

    return res.status(204).send();
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
