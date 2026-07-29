import type { NextFunction, Request, Response } from "express";
import {
  getTransactionById,
  getTransactionsList,
  getTransactionSummary,
} from "./transaction.service";

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
      category: category as string | undefined,
      limit: limit ? Number(limit) : undefined, // query params arrive as strings
      cursor: cursor as string | undefined,
    });

    return res.status(200).json(result); // { transactions, nextCursor }
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
    const { startDate, endDate, accountId } = req.query;

    const params = {
      userId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      accountId: accountId as string | undefined,
    };

    const summary = await getTransactionSummary(params);

    return res.status(200).json({ summary });
  } catch (err) {
    return next(err);
  }
}
