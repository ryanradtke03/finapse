import type { NextFunction, Request, Response } from "express";
import {
  getTransactionById,
  getTransactionsList,
  getTransactionSummary,
} from "./transaction.service";

// GET /transactions?startDate=&endDate=&accountId=&limit=&cursor=
export async function getTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, accountId, limit, cursor } = req.query;

    const params = {
      userId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      accountId: accountId as string | undefined,
      // Parse limit to number, default to 50 if not provided
      limit: limit ? parseInt(limit as string, 10) : 50,
      cursor: cursor as string | undefined,
    };

    const result = await getTransactionsList(params);

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

// GET /transactions/:id
export async function getTransactionByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
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

// GET /transactions/summary?startDate=&endDate=&accountId=
export async function getTransactionSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
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