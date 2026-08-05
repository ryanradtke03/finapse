// Load env before anything reads process.env (db/prisma + plaidClient read it
// at import time). Must be the first import.
import "dotenv/config";

import { Decimal } from "@prisma/client/runtime/client";
import bcrypt from "bcrypt";
import { Products } from "plaid";
import { prisma } from "../src/db/prisma";
import { syncTransactions } from "../src/features/plaid/plaid.service";
import { encrypt } from "../src/lib/encryption";
import { plaidClient } from "../src/lib/plaidClient";

// ── Demo account (FIN-114) ──────────────────────────────────────────────────
// Seeds a ready-to-use, pre-verified account for the public Sandbox demo, then
// connects a real Plaid Sandbox bank so the dashboard isn't empty on first load.
// Guarded behind SEED_DEMO=true so it can never run against a real prod DB.

const DEMO_EMAIL = "demo@finapse.com";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Demo User";

// Plaid's canonical Sandbox test institution.
const SANDBOX_INSTITUTION_ID = "ins_109508";
const SANDBOX_INSTITUTION_NAME = "First Platypus Bank";

// Primary-level categories so the spent-vs-limit bars reliably capture Sandbox
// spend (the aggregation treats a primary value as "every detailed row under
// it" — see buildDetailedCategoryWhere / Budgets.tsx).
const DEMO_BUDGETS: { category: string; limit: string }[] = [
  { category: "FOOD_AND_DRINK", limit: "600" },
  { category: "GENERAL_MERCHANDISE", limit: "400" },
  { category: "TRANSPORTATION", limit: "200" },
  { category: "TRAVEL", limit: "800" },
  { category: "ENTERTAINMENT", limit: "150" },
];

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

  // 4. Pull accounts + transactions through the real sync path.
  const result = await syncTransactions(userId, item.id);
  console.log(
    `[seed] connected ${SANDBOX_INSTITUTION_NAME} and synced`,
    result,
  );
}

async function seedDemoBudgets(userId: string): Promise<void> {
  // First of the current month, matching how the frontend keys periodStart.
  const now = new Date();
  const periodStart = new Date(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  );

  for (const b of DEMO_BUDGETS) {
    await prisma.budget.upsert({
      where: {
        userId_category_periodStart: {
          userId,
          category: b.category,
          periodStart,
        },
      },
      update: { limitAmount: new Decimal(b.limit) },
      create: {
        userId,
        category: b.category,
        limitAmount: new Decimal(b.limit),
        periodStart,
      },
    });
  }
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
