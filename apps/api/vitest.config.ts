import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // src/db/prisma.ts throws at import time if DATABASE_URL is unset, and
    // it gets pulled in transitively by anything importing a service file
    // (even for testing pure, DB-free functions like computeRecurringIds).
    // The adapter is only constructed here, never connected to, so a fake
    // value is enough to satisfy the import without needing a real database.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
  },
});
