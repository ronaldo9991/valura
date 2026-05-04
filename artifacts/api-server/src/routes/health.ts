import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/readyz", async (_req, res) => {
  const started = Date.now();
  try {
    const probe = pool.query("select 1 as up");
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("db_probe_timeout")), 2000),
    );
    await Promise.race([probe, timeout]);
    res.json({
      status: "ok",
      checks: { database: "ok" },
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    logger.error({ err }, "readiness probe failed");
    res.status(503).json({
      status: "degraded",
      checks: { database: "error" },
      latencyMs: Date.now() - started,
    });
  }
});

export default router;
