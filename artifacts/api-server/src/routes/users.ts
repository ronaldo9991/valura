import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/users", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json({ users: users.map(formatUser) });
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch users" });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.userId));
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch user" });
  }
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    riskProfile: user.riskProfile,
    kycStatus: user.kycStatus,
    investmentGoal: user.investmentGoal,
    currency: user.currency,
    totalPortfolioValue: Number(user.totalPortfolioValue),
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;
