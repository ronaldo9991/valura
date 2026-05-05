import express, { type Express } from "express";
import type { Server } from "node:http";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT ?? 8080);
/** Railway/Docker expect the process to listen on all interfaces, not only loopback. */
const host = process.env.HOST ?? "0.0.0.0";

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const app: Express = express();

/** Liveness only — no DB import so Railway can probe before migrations finish. */
app.get("/api/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const server: Server = app.listen(port, host, () => {
  logger.info({ port, host }, "Listening (liveness)");
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
    logger.error({ err }, "[start] bootstrap failed");
    process.exit(1);
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
