import type { NextFunction, Request, Response } from "express";
import {
  createLinkToken,
  deletePlaidAccount,
  deletePlaidItem,
  exchangePublicToken,
  findItemByPlaidItemId,
  getItemsService,
  markItemNeedsReauth,
  syncTransactions,
} from "./plaid.service";
import { routeWebhook, verifyPlaidWebhook } from "./plaid.webhook";

export async function createLinkTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { institution_id } = req.body; // optional
    const result = await createLinkToken(userId, institution_id);
    return res.json(result);
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

    if (!public_token || !institution?.id) {
      console.error("[exchange-token] invalid request body", {
        body: req.body,
        hasPublicToken: !!public_token,
        hasInstitution: !!institution,
      });
      throw Object.assign(
        new Error("Missing public_token or institution in request body"),
        { status: 400 },
      );
    }

    const item = await exchangePublicToken({
      userId,
      public_token,
      institution,
    });

    // Kick off initial sync in background — don't await
    syncTransactions(userId, item.id).catch((err) =>
      console.error("[sync] initial sync failed:", err),
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

// Force a full re-sync of an item's history to repopulate fields that were
// added after the transactions were first synced (FIN-95, FIN-98). Re-fetches
// everything from Plaid, so it's a deliberate, user-initiated action.
export async function backfillTransactionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const result = await syncTransactions(userId, itemId, { fullResync: true });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

// Plaid calls this directly (no auth cookie), so trust is established by
// verifying Plaid's signature over the raw body. On success we ack fast with
// 200 and do any real work out of band; a bad signature is the only 401.
export async function plaidWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const verified = await verifyPlaidWebhook(
      req.header("Plaid-Verification"),
      req.rawBody,
    );
    if (!verified) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const { webhook_type, webhook_code, item_id } = req.body ?? {};

    const action =
      typeof item_id === "string"
        ? routeWebhook(String(webhook_type), String(webhook_code))
        : "ignore";

    // Always 200 for anything we don't act on, so Plaid stops retrying.
    if (action === "ignore") {
      return res.status(200).json({ received: true });
    }

    const item = await findItemByPlaidItemId(item_id);
    if (!item) {
      // We no longer have this item (e.g. the bank was removed) — ack anyway.
      return res.status(200).json({ received: true });
    }

    if (action === "sync") {
      // Plaid expects a prompt 200 and a full sync can be slow, so kick it off
      // without blocking the response; log failures rather than surfacing them.
      syncTransactions(item.userId, item.id).catch((err) =>
        console.error("[webhook] sync failed", {
          itemId: item.id,
          err: String(err),
        }),
      );
    } else if (action === "reauth") {
      await markItemNeedsReauth(item.id);
    }

    return res.status(200).json({ received: true });
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
    const userId = req.user!.id;
    const items = await getItemsService(userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await deletePlaidItem(userId, id);

    return res.status(200).json({ message: "Bank removed successfully" });
  } catch (err) {
    return next(err);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await deletePlaidAccount(userId, id);

    res.status(200).json({ message: "Account removed successfully" });
  } catch (err) {
    next(err);
  }
}
