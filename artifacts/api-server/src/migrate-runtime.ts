import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { logger } from "./lib/logger";

/**
 * Apply Drizzle SQL migrations using the same folder as `lib/db` migrate script.
 * Resolved from this file so it works from bundled `dist/server/index.mjs` on Railway (`/app/dist/server`).
 */
export async function runSqlMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(here, "../../lib/db/drizzle");

  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool);

  logger.info({ migrationsFolder }, "[migrate] applying");
  await migrate(db, { migrationsFolder });
  logger.info("[migrate] done");

  await pool.end();
}
