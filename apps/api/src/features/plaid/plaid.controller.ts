import type { NextFunction, Request, Response } from "express";
import {
  createLinkToken,
  exchangePublicToken,
  getItemsService,
  syncTransactions
} from "./plaid.service";

export async function createLinkTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id
    const { institution_id } = req.body  // optional
    const result = await createLinkToken(userId, institution_id)
    return res.json(result)
  } catch (err) {
    return next(err)
  }
}


export async function exchangePublicTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { public_token, institution } = req.body;

    const item = await exchangePublicToken({ userId, public_token, institution });

    // Kick off initial sync in background — don't await
    syncTransactions(userId, item.id).catch((err) =>
      console.error("[sync] initial sync failed:", err)
    );

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

export async function syncTransactionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const result = await syncTransactions(userId, itemId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getItems(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id
    const items = await getItemsService(userId)
    res.json(items)
  } catch (err) {
    next(err)
  }
}
