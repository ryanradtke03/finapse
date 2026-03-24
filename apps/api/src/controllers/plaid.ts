import type { NextFunction, Request, Response } from "express";
import {
    createLinkToken,
    createUpdateLinkToken,
    exchangePublicToken,
    syncTransactions,
} from "../services/plaid";

export async function createLinkTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { link_token } = await createLinkToken(userId);
    return res.json({ link_token });
  } catch (err) {
    return next(err);
  }
}

export async function createUpdateLinkTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const { link_token } = await createUpdateLinkToken(userId, itemId);
    return res.json({ link_token });
  } catch (err) {
    return next(err);
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