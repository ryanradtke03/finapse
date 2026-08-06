// Load env before anything reads process.env (db/prisma + plaidClient read it
// at import time). Must be the first import.
import "dotenv/config";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import bcrypt from "bcrypt";
import { Products } from "plaid";
import { prisma } from "../src/db/prisma";
import { syncTransactions } from "../src/features/plaid/plaid.service";
import { encrypt } from "../src/lib/encryption";
import { plaidClient } from "../src/lib/plaidClient";

// ── Demo account (FIN-114) ──────────────────────────────────────────────────
// Seeds a ready-to-use, pre-verified account for the public Sandbox demo, then
// connects a real Plaid Sandbox bank (so accounts/logos/the Plaid flow are all
// genuine) and layers a *synthetic* transaction history on top — Plaid's own
// Sandbox transactions are too sparse to make the dashboard look like a real
// person's finances. Everything is date-relative to "now", so re-running the
// seed (see reseed cron) keeps the demo looking current.
//
// Guarded behind SEED_DEMO=true so it can never run against a real prod DB.

const DEMO_EMAIL = "demo@finapse.com";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Demo User";

// Plaid's canonical Sandbox test institution.
const SANDBOX_INSTITUTION_ID = "ins_109508";
const SANDBOX_INSTITUTION_NAME = "First Platypus Bank";

// How many days of history to generate (a bit over 4 months so the
// Transactions page has depth and recurring detection has enough repetitions).
const HISTORY_DAYS = 130;

// Believable balances so the Total Balance / net-worth cards read sensibly
// alongside the generated cash flow (Plaid's Sandbox balances are tiny/random).
const CHECKING_BALANCE = "8452.30";
const SAVINGS_BALANCE = "12680.00";
const CREDIT_BALANCE = "1240.55"; // owed on the card (a liability)

// Primary-level budgets for the current month, sized against the generated
// spend to show a realistic spread — some comfortably under, a couple at-risk.
// Primary categories intentionally: the aggregation treats a primary as "every
// detailed row under it" (see buildDetailedCategoryWhere / Budgets.tsx).
const DEMO_BUDGETS: { category: string; limit: string }[] = [
  { category: "RENT_AND_UTILITIES", limit: "2050" },
  { category: "FOOD_AND_DRINK", limit: "850" },
  { category: "TRANSPORTATION", limit: "275" },
  { category: "GENERAL_MERCHANDISE", limit: "250" },
  { category: "ENTERTAINMENT", limit: "40" },
  { category: "PERSONAL_CARE", limit: "45" },
];

// ── small helpers ───────────────────────────────────────────────────────────

function money(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function chance(p: number): boolean {
  return Math.random() < p;
}

async function seedDemoUser(): Promise<string> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { emailVerified: true, fullName: DEMO_NAME },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      fullName: DEMO_NAME,
      emailVerified: true,
    },
  });
  console.log(`[seed] demo user ready: ${DEMO_EMAIL} (${user.id})`);
  return user.id;
}

async function connectSandboxBank(userId: string): Promise<void> {
  // Idempotent: if the demo user already has a bank, don't stack another.
  const existing = await prisma.plaidItem.findFirst({ where: { userId } });
  if (existing) {
    console.log("[seed] demo user already has a Plaid item — skipping connect");
    return;
  }

  if (!process.env.PLAID_CLIENT_ID) {
    console.warn(
      "[seed] PLAID_CLIENT_ID not set — seeding the demo user without bank data.",
    );
    return;
  }

  // 1. Mint a Sandbox item directly (no Link UI needed).
  const { data: created } = await plaidClient.sandboxPublicTokenCreate({
    institution_id: SANDBOX_INSTITUTION_ID,
    initial_products: [Products.Transactions],
  });

  // 2. Exchange the public token for a permanent access token.
  const { data: exchanged } = await plaidClient.itemPublicTokenExchange({
    public_token: created.public_token,
  });

  // 3. Store the item (access token encrypted at rest, like the real flow).
  const item = await prisma.plaidItem.create({
    data: {
      userId,
      accessToken: encrypt(exchanged.access_token),
      itemId: exchanged.item_id,
      institutionId: SANDBOX_INSTITUTION_ID,
      institutionName: SANDBOX_INSTITUTION_NAME,
      status: "ACTIVE",
    },
  });

  // 4. Pull the real accounts (source of truth) through the sync path. We keep
  //    the accounts (real Plaid IDs, balances, institution logo) but overwrite
  //    the sparse Sandbox transactions with our synthetic history below.
  const result = await syncTransactions(userId, item.id);
  console.log(`[seed] connected ${SANDBOX_INSTITUTION_NAME} and synced`, result);
}

// ── synthetic transaction history ───────────────────────────────────────────

type Row = Prisma.TransactionCreateManyInput;

function buildTransactions(checkingId: string, creditId: string): Row[] {
  const rows: Row[] = [];
  const today = new Date();

  const add = (
    accountId: string,
    amount: number, // + = spend/outflow, − = income/inflow
    name: string,
    merchantName: string,
    primary: string,
    detail: string,
    date: Date,
    channel: "in store" | "online" | "other" = "in store",
  ) => {
    rows.push({
      plaidTransactionId: `demo_${randomUUID()}`,
      accountId,
      amount: new Decimal(amount.toFixed(2)),
      isoCurrencyCode: "USD",
      date,
      name,
      merchantName,
      category: [],
      personalFinanceCategory: primary,
      personalFinanceCategoryDetail: detail,
      paymentChannel: channel,
      pending: false,
    });
  };

  for (let i = HISTORY_DAYS; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Noon UTC so the calendar day never shifts under timezone conversion.
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
    const dom = d.getDate();

    // ── Fixed monthly ──
    // Paychecks: semi-monthly on the 1st and 15th (income is a negative amount).
    if (dom === 1 || dom === 15) {
      add(checkingId, -2150, "ACME CORP PAYROLL", "Acme Corp", "INCOME", "INCOME_SALARY", date, "other");
    }
    if (dom === 1) {
      add(checkingId, 1750, "GREENFIELD APARTMENTS", "Greenfield Apartments", "RENT_AND_UTILITIES", "RENT_AND_UTILITIES_RENT", date, "other");
    }
    if (dom === 8) {
      add(checkingId, 69.99, "XFINITY INTERNET", "Xfinity", "RENT_AND_UTILITIES", "RENT_AND_UTILITIES_INTERNET_AND_CABLE", date, "online");
    }
    if (dom === 12) {
      add(checkingId, money(78, 142), "CITY POWER & LIGHT", "City Power & Light", "RENT_AND_UTILITIES", "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY", date, "online");
    }
    if (dom === 18) {
      add(checkingId, 65.0, "VERIZON WIRELESS", "Verizon", "RENT_AND_UTILITIES", "RENT_AND_UTILITIES_TELEPHONE", date, "online");
    }

    // ── Subscriptions (same merchant + amount every month → flagged recurring) ──
    if (dom === 3) {
      add(creditId, 39.99, "PLANET FITNESS", "Planet Fitness", "PERSONAL_CARE", "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS", date, "other");
    }
    if (dom === 5) {
      add(creditId, 15.49, "NETFLIX.COM", "Netflix", "ENTERTAINMENT", "ENTERTAINMENT_TV_AND_MOVIES", date, "online");
    }
    if (dom === 9) {
      add(creditId, 11.99, "SPOTIFY USA", "Spotify", "ENTERTAINMENT", "ENTERTAINMENT_MUSIC_AND_AUDIO", date, "online");
    }

    // ── Variable everyday spend (on the credit card, like most people) ──
    if (chance(0.45)) {
      add(creditId, money(4.25, 6.75), pick(["STARBUCKS", "BLUE BOTTLE COFFEE", "PEET'S COFFEE"]), pick(["Starbucks", "Blue Bottle", "Peet's Coffee"]), "FOOD_AND_DRINK", "FOOD_AND_DRINK_COFFEE", date);
    }
    if (chance(0.3)) {
      const spot = pick(["CHIPOTLE", "OLIVE GARDEN", "THAI BASIL", "THE CHEESECAKE FACTORY", "SWEETGREEN"]);
      add(creditId, money(15, 48), spot, spot.split(" ").map((w) => w[0] + w.slice(1).toLowerCase()).join(" "), "FOOD_AND_DRINK", "FOOD_AND_DRINK_RESTAURANT", date);
    }
    if (chance(0.22)) {
      const store = pick(["WHOLE FOODS", "TRADER JOE'S", "SAFEWAY", "KROGER"]);
      add(creditId, money(35, 110), store, store.split(" ").map((w) => w[0] + w.slice(1).toLowerCase()).join(" "), "FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES", date);
    }
    if (chance(0.14)) {
      add(creditId, money(8, 15), pick(["MCDONALD'S", "CHICK-FIL-A", "TACO BELL"]), pick(["McDonald's", "Chick-fil-A", "Taco Bell"]), "FOOD_AND_DRINK", "FOOD_AND_DRINK_FAST_FOOD", date);
    }
    if (chance(0.14)) {
      add(creditId, money(36, 58), pick(["SHELL", "CHEVRON", "COSTCO GAS"]), pick(["Shell", "Chevron", "Costco"]), "TRANSPORTATION", "TRANSPORTATION_GAS", date);
    }
    if (chance(0.08)) {
      add(creditId, money(11, 28), pick(["UBER TRIP", "LYFT RIDE"]), pick(["Uber", "Lyft"]), "TRANSPORTATION", "TRANSPORTATION_TAXIS_AND_RIDE_SHARES", date, "online");
    }
    if (chance(0.11)) {
      const shop = pick([
        { n: "AMAZON.COM", m: "Amazon", d: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES" },
        { n: "TARGET", m: "Target", d: "GENERAL_MERCHANDISE_SUPERSTORES" },
        { n: "BEST BUY", m: "Best Buy", d: "GENERAL_MERCHANDISE_ELECTRONICS" },
      ]);
      add(creditId, money(18, 140), shop.n, shop.m, "GENERAL_MERCHANDISE", shop.d, date, "online");
    }
    if (chance(0.04)) {
      add(creditId, money(9, 42), "CVS PHARMACY", "CVS", "MEDICAL", "MEDICAL_PHARMACIES_AND_SUPPLEMENTS", date);
    }
  }

  return rows;
}

async function seedDemoData(userId: string): Promise<void> {
  const accounts = await prisma.account.findMany({
    where: { plaidItem: { userId } },
  });
  if (accounts.length === 0) {
    console.warn(
      "[seed] demo user has no accounts (Plaid not configured?) — skipping synthetic transactions",
    );
    return;
  }

  const checking =
    accounts.find((a) => a.type === "depository" && a.subtype === "checking") ??
    accounts.find((a) => a.type === "depository") ??
    accounts[0];
  const savings = accounts.find(
    (a) => a.type === "depository" && a.subtype === "savings",
  );
  const credit = accounts.find((a) => a.type === "credit") ?? checking;

  // Fresh slate — idempotent, and exactly what a reseed cron needs: wipe the
  // demo user's transactions (including any a visitor added) before regenerating.
  const accountIds = accounts.map((a) => a.id);
  const deleted = await prisma.transaction.deleteMany({
    where: { accountId: { in: accountIds } },
  });
  if (deleted.count) console.log(`[seed] cleared ${deleted.count} existing transactions`);

  // Believable balances.
  await prisma.account.update({
    where: { id: checking.id },
    data: {
      balanceCurrent: new Decimal(CHECKING_BALANCE),
      balanceAvailable: new Decimal(CHECKING_BALANCE),
    },
  });
  if (savings) {
    await prisma.account.update({
      where: { id: savings.id },
      data: {
        balanceCurrent: new Decimal(SAVINGS_BALANCE),
        balanceAvailable: new Decimal(SAVINGS_BALANCE),
      },
    });
  }
  if (credit.id !== checking.id) {
    await prisma.account.update({
      where: { id: credit.id },
      data: {
        balanceCurrent: new Decimal(CREDIT_BALANCE),
        balanceAvailable: null,
      },
    });
  }

  const rows = buildTransactions(checking.id, credit.id);
  await prisma.transaction.createMany({ data: rows });
  console.log(`[seed] generated ${rows.length} synthetic transactions across ~${HISTORY_DAYS} days`);
}

async function seedDemoBudgets(userId: string): Promise<void> {
  // First of the current month, matching how the frontend keys periodStart.
  const now = new Date();
  const periodStart = new Date(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  );

  // Reseed-friendly: clear this month's budgets first so a changed lineup never
  // leaves stale categories behind.
  await prisma.budget.deleteMany({ where: { userId, periodStart } });

  await prisma.budget.createMany({
    data: DEMO_BUDGETS.map((b) => ({
      userId,
      category: b.category,
      limitAmount: new Decimal(b.limit),
      periodStart,
    })),
  });
  console.log(`[seed] seeded ${DEMO_BUDGETS.length} budgets for the current month`);
}

async function main() {
  if (process.env.SEED_DEMO !== "true") {
    console.log(
      "[seed] SEED_DEMO is not 'true' — skipping. Run with SEED_DEMO=true to seed the demo account.",
    );
    return;
  }

  console.log("[seed] seeding demo account…");
  const userId = await seedDemoUser();

  // A Plaid failure shouldn't abort the whole seed — the user + budgets are
  // still useful on their own.
  try {
    await connectSandboxBank(userId);
  } catch (err) {
    console.error("[seed] Plaid sandbox connect failed (continuing):", err);
  }

  await seedDemoData(userId);
  await seedDemoBudgets(userId);
  console.log("[seed] demo seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
