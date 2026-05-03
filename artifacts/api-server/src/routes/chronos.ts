import { Router } from "express";
import { simulatePortfolio } from "../lib/chronos";

const router = Router();

router.post("/chronos/simulate", async (req, res) => {
  try {
    const { startDate, positions, includeBenchmark } = req.body ?? {};
    if (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      res.status(400).json({ error: "invalid_date", message: "startDate must be YYYY-MM-DD" });
      return;
    }
    if (!Array.isArray(positions) || positions.length === 0) {
      res.status(400).json({ error: "no_positions", message: "Provide at least one position" });
      return;
    }
    const coerced: { symbol: string; dollarAmount: number }[] = [];
    for (const p of positions) {
      if (!p || typeof p !== "object") continue;
      const sym = typeof p.symbol === "string" ? p.symbol.trim().toUpperCase() : "";
      const amt = Number(p.dollarAmount);
      if (!sym || !Number.isFinite(amt) || amt <= 0) {
        res.status(400).json({
          error: "invalid_position",
          message: "Each position needs a non-empty symbol and a positive numeric dollarAmount.",
        });
        return;
      }
      coerced.push({ symbol: sym, dollarAmount: amt });
    }
    if (coerced.length === 0) {
      res.status(400).json({ error: "no_positions", message: "Provide at least one valid position" });
      return;
    }
    const result = await simulatePortfolio(startDate, coerced, includeBenchmark !== false);
    if (!result) {
      res.status(400).json({ error: "simulation_failed", message: "Could not back-test those symbols on that date." });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Chronos simulation failed");
    res.status(500).json({ error: "internal_error", message: "Simulation failed" });
  }
});

export default router;
