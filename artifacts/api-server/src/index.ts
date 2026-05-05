import express, { type Express, type Response } from "express";
import type { Server } from "node:http";
import { logger } from "./lib/logger";
import { attachProductionStatic } from "./production-static.js";

const rawPort = process.env.PORT ?? "8080";
const port = Number.parseInt(String(rawPort).trim(), 10);
/** Railway/Docker expect the process to listen on all interfaces, not only loopback. */
const host = (process.env.HOST ?? "0.0.0.0").trim();

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const app: Express = express();

const okLive = (_req: unknown, res: Response) => {
  res.status(200).json({ status: "ok" });
};

/** Liveness — no DB. Some proxies probe `/healthz` instead of `/api/healthz`. */
app.get("/healthz", okLive);
app.get("/api/healthz", okLive);

attachProductionStatic(app);

const server: Server = app.listen(port, host, () => {
  logger.info(
    { port, host, hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()) },
    "Listening (liveness)",
  );
  void bootstrap(app);
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

async function bootstrap(expressApp: Express) {
  try {
    const { runSqlMigrations } = await import("./migrate-runtime.js");
    await runSqlMigrations();

    const { attachMainApplication } = await import("./app.js");
    attachMainApplication(expressApp);
    logger.info("[start] migrations + routes ready");
  } catch (err) {
    logger.error(
      { err },
      "[start] migrations/bootstrap failed — SPA + liveness still served; API routes missing until Postgres is linked and service restarted.",
    );
    if (process.env.STRICT_BOOT === "1") {
      process.exit(1);
    }
  }
}

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received, draining server");
  const forceExit = setTimeout(() => {
    logger.error("Forced exit after shutdown timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error closing HTTP server");
    }
    try {
      const { pool } = await import("@workspace/db");
      await pool.end();
      logger.info("Postgres pool drained, exiting cleanly");
    } catch (poolErr) {
      logger.error({ err: poolErr }, "Error closing pg pool (may be expected if bootstrap never finished)");
    } finally {
      clearTimeout(forceExit);
      process.exit(err ? 1 : 0);
    }
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
