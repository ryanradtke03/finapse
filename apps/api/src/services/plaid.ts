import {
    CountryCode,
    Products,
    type AccountBase,
    type LinkTokenCreateRequest,
    type Transaction as PlaidTransaction,
} from "plaid";
import { prisma } from "../db/prisma";
import { decrypt, encrypt } from "../lib/encryption";
import { plaidClient } from "../lib/plaidClient";
  
  // ─────────────────────────────────────────
  // createLinkToken — new bank connection
  // ─────────────────────────────────────────
  
  export async function createLinkToken(userId: string) {
    const plaidReq: LinkTokenCreateRequest = {
      user: { client_user_id: userId },
      client_name: "Finapse",
      products: [Products.Transactions],
      language: "en",
      country_codes: [CountryCode.Us],
    };
  
    const { data } = await plaidClient.linkTokenCreate(plaidReq);
    return { link_token: data.link_token };
  }
  
  // ─────────────────────────────────────────
  // createUpdateLinkToken — manage accounts on existing connection
  // Passes access_token → Plaid opens Link in update mode
  // User can add/remove accounts without a new token exchange
  // ─────────────────────────────────────────
  
  export async function createUpdateLinkToken(userId: string, plaidItemId: string) {
    const item = await prisma.plaidItem.findFirst({
      where: { id: plaidItemId, userId },
    });
  
    if (!item) {
      throw Object.assign(new Error("Item not found"), { status: 404 });
    }
  
    const { data } = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Finapse",
      products: [Products.Transactions],
      language: "en",
      country_codes: [CountryCode.Us],
      access_token: decrypt(item.accessToken),
    });
  
    return { link_token: data.link_token };
  }
  
  // ─────────────────────────────────────────
  // exchangePublicToken — new connections only
  // Not called after update mode — access_token already exists
  // ─────────────────────────────────────────
  
  type ExchangeInput = {
    userId: string;
    public_token: string;
    institution: {
      id: string;
      name: string;
    };
  };
  
  export async function exchangePublicToken({
    userId,
    public_token,
    institution,
  }: ExchangeInput) {
    const { data } = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = data;
  
    // Block duplicate connections of the exact same bank login
    const existing = await prisma.plaidItem.findFirst({
      where: { userId, itemId: item_id },
    });
  
    if (existing) {
      throw Object.assign(
        new Error("This account is already connected"),
        { status: 409 }
      );
    }
  
    const encryptedToken = encrypt(access_token);
  
    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId,
        itemId:          item_id,
        accessToken:     encryptedToken,
        institutionId:   institution.id,
        institutionName: institution.name,
        status:          "ACTIVE",
      },
    });
  
    return plaidItem;
  }
  
  // ─────────────────────────────────────────
  // syncTransactions — initial and delta syncs
  // cursor = null   → full history (first sync or after update mode)
  // cursor = string → delta only (subsequent syncs)
  // ─────────────────────────────────────────
  
  export async function syncTransactions(userId: string, plaidItemId: string) {
    const item = await prisma.plaidItem.findFirst({
      where: { id: plaidItemId, userId },
    });
  
    if (!item) {
      throw Object.assign(new Error("Item not found"), { status: 404 });
    }
  
    if (item.status === "DISCONNECTED") {
      throw Object.assign(new Error("PlaidItem is disconnected"), { status: 400 });
    }
  
    const accessToken = decrypt(item.accessToken);
  
    let cursor      = item.transactionCursor ?? undefined;
    let added:      PlaidTransaction[] = [];
    let modified:   PlaidTransaction[] = [];
    let removedIds: string[]           = [];
    let accounts:   AccountBase[]      = [];
    let hasMore = true;
  
    while (hasMore) {
      const { data } = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
        options: { include_personal_finance_category: true },
      });
  
      added      = added.concat(data.added);
      modified   = modified.concat(data.modified);
      removedIds = removedIds.concat(data.removed.map((t) => t.transaction_id));
      accounts   = data.accounts;
      hasMore    = data.has_more;
      cursor     = data.next_cursor;
    }
  
    await prisma.$transaction(async (tx) => {
      // 1. Upsert accounts — picks up newly added accounts after update mode
      for (const acc of accounts) {
        await tx.account.upsert({
          where:  { plaidAccountId: acc.account_id },
          create: {
            plaidAccountId:   acc.account_id,
            plaidItemId:      item.id,
            name:             acc.name,
            officialName:     acc.official_name ?? null,
            mask:             acc.mask ?? null,
            type:             acc.type,
            subtype:          acc.subtype ?? null,
            balanceCurrent:   acc.balances.current ?? null,
            balanceAvailable: acc.balances.available ?? null,
            isoCurrencyCode:  acc.balances.iso_currency_code ?? "USD",
          },
          update: {
            balanceCurrent:   acc.balances.current ?? null,
            balanceAvailable: acc.balances.available ?? null,
            isoCurrencyCode:  acc.balances.iso_currency_code ?? "USD",
          },
        });
      }
  
      // 2. Upsert added transactions
      for (const t of added) {
        const account = await tx.account.findUnique({
          where: { plaidAccountId: t.account_id },
        });
        if (!account) continue;
  
        await tx.transaction.upsert({
          where:  { plaidTransactionId: t.transaction_id },
          create: mapTransaction(t, account.id),
          update: mapTransaction(t, account.id),
        });
      }
  
      // 3. Upsert modified transactions
      for (const t of modified) {
        const account = await tx.account.findUnique({
          where: { plaidAccountId: t.account_id },
        });
        if (!account) continue;
  
        await tx.transaction.upsert({
          where:  { plaidTransactionId: t.transaction_id },
          create: mapTransaction(t, account.id),
          update: mapTransaction(t, account.id),
        });
      }
  
      // 4. Delete removed transactions
      if (removedIds.length > 0) {
        await tx.transaction.deleteMany({
          where: { plaidTransactionId: { in: removedIds } },
        });
      }
  
      // 5. Save cursor — must be in same transaction
      await tx.plaidItem.update({
        where: { id: item.id },
        data:  { transactionCursor: cursor },
      });
    });
  
    return {
      added:    added.length,
      modified: modified.length,
      removed:  removedIds.length,
    };
  }
  
  // ─────────────────────────────────────────
  // mapTransaction — shared shape for upserts
  // ─────────────────────────────────────────
  
  function mapTransaction(t: PlaidTransaction, accountId: string) {
    return {
      plaidTransactionId:      t.transaction_id,
      accountId,
      amount:                  t.amount,
      isoCurrencyCode:         t.iso_currency_code ?? "USD",
      date:                    new Date(t.date),
      name:                    t.name,
      merchantName:            t.merchant_name ?? null,
      category:                t.category ?? [],
      personalFinanceCategory: t.personal_finance_category?.primary ?? null,
      pending:                 t.pending,
    };
  }