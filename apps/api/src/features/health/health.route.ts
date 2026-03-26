import { Router } from "express";
import { prisma } from "../../db/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "ok" });
  } catch (err) {
    console.error("health db check failed:", err);
    res.status(500).json({ ok: false, db: "down" });
  }
});


export default router;
