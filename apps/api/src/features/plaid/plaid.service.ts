import {
  CountryCode,
  Products,
  type AccountBase,
  type Transaction as PlaidTransaction
} from "plaid";
import { prisma } from "../../db/prisma";
import { decrypt, encrypt } from "../../lib/encryption";
import { plaidClient } from "../../lib/plaidClient";

  // ─────────────────────────────────────────
  // createLinkToken — new bank connection
  // ─────────────────────────────────────────

  export async function createLinkToken(userId: string, institutionId?: string) {
    if (institutionId) {
      const item = await prisma.plaidItem.findFirst({
        where: { userId, institutionId },
      })

      if (!item) {
        throw Object.assign(new Error("Item not found"), { status: 404 })
      }

      const { data } = await plaidClient.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: "Finapse",
        access_token: decrypt(item.accessToken),
        update: { account_selection_enabled: true },
        language: "en",
        country_codes: [CountryCode.Us],
      })

      return { link_token: data.link_token, mode: 'update' as const, item_id: item.id }
    }

    const { data } = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Finapse",
      products: [Products.Transactions],
      language: "en",
      country_codes: [CountryCode.Us],
    })

    return { link_token: data.link_token, mode: 'new' as const }
  }


  // ─────────────────────────────────────────
  // exchangePublicToken — new connections only
  // Not called after update mode — access_token already exists
  // ─────────────────────────────────────────
    type InstitutionAccount = {
    id: string
    name: string
    mask: string | null
    type: string
    subtype: string | null
  }

  type ExchangeInput = {
    userId: string
    public_token: string
    institution: {
      id: string
      name: string
      accounts: InstitutionAccount[]
    }
  }

  export async function exchangePublicToken({
    userId,
    public_token,
    institution,
  }: ExchangeInput) {

    console.log("[exchange] start", { userId, institutionId: institution.id, institutionName: institution.name })
    console.log("[exchange] metadata accounts", institution.accounts.map(a => ({ id: a.id, name: a.name, mask: a.mask })))

    const existingItem = await prisma.plaidItem.findFirst({
      where: { userId, institutionId: institution.id },
    })

    console.log("[exchange] existingItem lookup", { found: !!existingItem, id: existingItem?.id ?? null })

    if (existingItem) {
      console.log("[exchange] >>> existing item branch")

      const storedAccounts = await prisma.account.findMany({
        where: { plaidItemId: existingItem.id },
        select: { plaidAccountId: true, name: true },
      })

      console.log("[exchange] stored accounts in DB", storedAccounts.map(a => ({ id: a.plaidAccountId, name: a.name })))

      const storedIds = new Set(storedAccounts.map(a => a.plaidAccountId))
      const newAccounts = institution.accounts.filter(a => !storedIds.has(a.id))

      console.log("[exchange] new accounts from metadata (not yet in DB)", newAccounts.map(a => ({ id: a.id, name: a.name })))

      if (newAccounts.length > 0) {
        // console.log("[exchange] inserting", newAccounts.length, "new accounts from metadata")

        // await prisma.account.createMany({
        //   data: newAccounts.map(a => ({
        //     plaidAccountId: a.id,
        //     name: a.name,
        //     mask: a.mask ?? null,
        //     type: a.type,
        //     subtype: a.subtype ?? null,
        //     plaidItemId: existingItem.id,
        //   })),
        // })

        // console.log("[exchange] createMany done — now backfilling via accountsGet")

        console.log("[exchange] resetting cursor for full re-sync")
        await prisma.plaidItem.update({
          where: { id: existingItem.id },
          data: { transactionCursor: null },
        })
        console.log("[exchange] cursor reset ok")

        let decryptedToken: string
        try {
          decryptedToken = decrypt(existingItem.accessToken)
          console.log("[exchange] decrypt ok")
        } catch (err) {
          console.error("[exchange] decrypt FAILED", err)
          throw err
        }

        let accountsRes
        try {
          accountsRes = await plaidClient.accountsGet({ access_token: decryptedToken })
          console.log("[exchange] accountsGet returned", accountsRes.data.accounts.length, "accounts")
          console.log("[exchange] accountsGet detail", accountsRes.data.accounts.map(a => ({
            account_id: a.account_id,
            name: a.name,
            mask: a.mask,
            balance: a.balances.current,
            official_name: a.official_name,
          })))
        } catch (err) {
          console.error("[exchange] accountsGet FAILED", err)
          throw err
        }

        console.log("[exchange] upserting all accounts returned by Plaid")

        for (const acc of accountsRes.data.accounts) {
          console.log("[exchange] upserting", acc.account_id, acc.name)
          try {
            await prisma.account.upsert({
              where: { plaidAccountId: acc.account_id },
              create: {
                plaidAccountId:   acc.account_id,
                name:             acc.name,
                officialName:     acc.official_name ?? null,
                mask:             acc.mask ?? null,
                type:             acc.type,
                subtype:          acc.subtype ?? null,
                balanceCurrent:   acc.balances.current ?? null,
                balanceAvailable: acc.balances.available ?? null,
                isoCurrencyCode:  acc.balances.iso_currency_code ?? 'USD',
                plaidItemId:      existingItem.id,
              },
              update: {
                officialName:     acc.official_name ?? null,
                balanceCurrent:   acc.balances.current ?? null,
                balanceAvailable: acc.balances.available ?? null,
                isoCurrencyCode:  acc.balances.iso_currency_code ?? 'USD',
              },
            })
            console.log("[exchange] upsert ok", acc.account_id)
          } catch (err) {
            console.error("[exchange] upsert FAILED for", acc.account_id, err)
            throw err
          }
        }

        console.log("[exchange] all upserts done")

      } else {
        console.log("[exchange] no new accounts in metadata — nothing to insert")
      }

      console.log("[exchange] existing item branch complete, returning item")
      return existingItem
    }

    // New item
    console.log("[exchange] >>> new item branch")

    let exchangeRes
    try {
      exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token })
      console.log("[exchange] token exchanged ok", { itemId: exchangeRes.data.item_id })
    } catch (err) {
      console.error("[exchange] itemPublicTokenExchange FAILED", err)
      throw err
    }

    const { access_token, item_id } = exchangeRes.data

    let newItem
    try {
      newItem = await prisma.plaidItem.create({
        data: {
          userId,
          accessToken: encrypt(access_token),
          itemId: item_id,
          institutionId: institution.id,
          institutionName: institution.name,
          status: 'ACTIVE',
        },
      })
      console.log("[exchange] PlaidItem created", { newItemId: newItem.id })
    } catch (err) {
      console.error("[exchange] PlaidItem create FAILED", err)
      throw err
    }

    let accountsRes
    try {
      accountsRes = await plaidClient.accountsGet({ access_token })
      console.log("[exchange] accountsGet for new item returned", accountsRes.data.accounts.length, "accounts")
      console.log("[exchange] accountsGet detail", accountsRes.data.accounts.map(a => ({
        account_id: a.account_id,
        name: a.name,
        mask: a.mask,
        balance: a.balances.current,
        official_name: a.official_name,
      })))
    } catch (err) {
      console.error("[exchange] accountsGet FAILED for new item", err)
      throw err
    }

    try {
      await prisma.account.createMany({
        data: accountsRes.data.accounts.map(a => ({
          plaidAccountId:   a.account_id,
          name:             a.name,
          officialName:     a.official_name ?? null,
          mask:             a.mask ?? null,
          type:             a.type,
          subtype:          a.subtype ?? null,
          balanceCurrent:   a.balances.current ?? null,
          balanceAvailable: a.balances.available ?? null,
          isoCurrencyCode:  a.balances.iso_currency_code ?? 'USD',
          plaidItemId:      newItem.id,
        })),
      })
      console.log("[exchange] accounts stored for new item", accountsRes.data.accounts.length)
    } catch (err) {
      console.error("[exchange] account createMany FAILED", err)
      throw err
    }

    console.log("[exchange] new item branch complete")
    return newItem
  }

  // ─────────────────────────────────────────
  // syncTransactions — initial and delta syncs
  // cursor = null   → full history (first sync or after update mode)
  // cursor = string → delta only (subsequent syncs)
  // ─────────────────────────────────────────

  export async function syncTransactions(userId: string, plaidItemId: string) {
    console.log("[sync] start", { userId, plaidItemId })

    const item = await prisma.plaidItem.findFirst({
      where: { id: plaidItemId, userId },
    });

    if (!item) {
      console.error("[sync] item not found", { plaidItemId, userId })
      throw Object.assign(new Error("Item not found"), { status: 404 });
    }

    if (item.status === "DISCONNECTED") {
      console.error("[sync] item is disconnected", { plaidItemId })
      throw Object.assign(new Error("PlaidItem is disconnected"), { status: 400 });
    }

    console.log("[sync] item found", { itemId: item.id, institutionId: item.institutionId, status: item.status, hasCursor: !!item.transactionCursor })

    const accessToken = decrypt(item.accessToken);
    console.log("[sync] token decrypted ok")

    let cursor      = item.transactionCursor ?? undefined;
    let added:      PlaidTransaction[] = [];
    let modified:   PlaidTransaction[] = [];
    let removedIds: string[]           = [];
    let accounts:   AccountBase[]      = [];
    let hasMore = true;
    let page = 0;

    while (hasMore) {
      page++
      console.log("[sync] transactionsSync page", page, { hasCursor: !!cursor })

      const { data } = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
        options: { include_personal_finance_category: true },
      });

      console.log("[sync] page", page, "result", {
        added: data.added.length,
        modified: data.modified.length,
        removed: data.removed.length,
        hasMore: data.has_more,
        accounts: data.accounts.map(a => ({
          account_id: a.account_id,
          name: a.name,
          mask: a.mask,
          balance: a.balances.current,
        })),
      })

      added      = added.concat(data.added);
      modified   = modified.concat(data.modified);
      removedIds = removedIds.concat(data.removed.map((t) => t.transaction_id));
      accounts   = data.accounts;
      hasMore    = data.has_more;
      cursor     = data.next_cursor;
    }

    console.log("[sync] transactionsSync complete", {
      totalAdded: added.length,
      totalModified: modified.length,
      totalRemoved: removedIds.length,
      totalAccounts: accounts.length,
    })

    // accountsGet is the source of truth for accounts
    // transactionsSync may miss newly added accounts in sandbox
    console.log("[sync] calling accountsGet for account source of truth")
    const accountsGetRes = await plaidClient.accountsGet({ access_token: accessToken })
    const allAccounts = accountsGetRes.data.accounts
    console.log("[sync] accountsGet returned", allAccounts.length, "accounts", allAccounts.map(a => ({
      account_id: a.account_id,
      name: a.name,
      mask: a.mask,
      balance: a.balances.current,
      official_name: a.official_name,
    })))

    await prisma.$transaction(async (tx) => {
      // 1. Upsert accounts from accountsGet — source of truth
      console.log("[sync] step 1 — upserting", allAccounts.length, "accounts from accountsGet")
      for (const acc of allAccounts) {
        console.log("[sync] upserting account", { account_id: acc.account_id, name: acc.name, balance: acc.balances.current })
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
            officialName:     acc.official_name ?? null,
            balanceCurrent:   acc.balances.current ?? null,
            balanceAvailable: acc.balances.available ?? null,
            isoCurrencyCode:  acc.balances.iso_currency_code ?? "USD",
          },
        });
        console.log("[sync] account upsert ok", acc.account_id)
      }
      console.log("[sync] step 1 done")

      // 2. Upsert added transactions
      console.log("[sync] step 2 — upserting", added.length, "added transactions")
      for (const t of added) {
        const account = await tx.account.findUnique({
          where: { plaidAccountId: t.account_id },
        });
        if (!account) {
          console.warn("[sync] no account found for transaction", { transaction_id: t.transaction_id, account_id: t.account_id })
          continue;
        }
        await tx.transaction.upsert({
          where:  { plaidTransactionId: t.transaction_id },
          create: mapTransaction(t, account.id),
          update: mapTransaction(t, account.id),
        });
      }
      console.log("[sync] step 2 done")

      // 3. Upsert modified transactions
      console.log("[sync] step 3 — upserting", modified.length, "modified transactions")
      for (const t of modified) {
        const account = await tx.account.findUnique({
          where: { plaidAccountId: t.account_id },
        });
        if (!account) {
          console.warn("[sync] no account found for modified transaction", { transaction_id: t.transaction_id, account_id: t.account_id })
          continue;
        }
        await tx.transaction.upsert({
          where:  { plaidTransactionId: t.transaction_id },
          create: mapTransaction(t, account.id),
          update: mapTransaction(t, account.id),
        });
      }
      console.log("[sync] step 3 done")

      // 4. Delete removed transactions
      console.log("[sync] step 4 — deleting", removedIds.length, "removed transactions")
      if (removedIds.length > 0) {
        await tx.transaction.deleteMany({
          where: { plaidTransactionId: { in: removedIds } },
        });
      }
      console.log("[sync] step 4 done")

      // 5. Save cursor
      console.log("[sync] step 5 — saving cursor", cursor)
      await tx.plaidItem.update({
        where: { id: item.id },
        data:  { transactionCursor: cursor },
      });
      console.log("[sync] step 5 done")
    });

    console.log("[sync] complete", { added: added.length, modified: modified.length, removed: removedIds.length })

    return {
      added:    added.length,
      modified: modified.length,
      removed:  removedIds.length,
    };
  }

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
