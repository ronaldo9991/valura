import { pool } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT ?? 8080);
/** Railway/Docker expect the process to listen on all interfaces, not only loopback. */
const host = process.env.HOST ?? "0.0.0.0";

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const server = app.listen(port, host, () => {
  logger.info({ port, host }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

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
      await pool.end();
      logger.info("Postgres pool drained, exiting cleanly");
    } catch (poolErr) {
      logger.error({ err: poolErr }, "Error closing pg pool");
    } finally {
      clearTimeout(forceExit);
      process.exit(err ? 1 : 0);
    }
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
