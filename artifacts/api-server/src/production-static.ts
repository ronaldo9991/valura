import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import express from "express";

/**
 * Vite build lives at `../public` relative to the bundled server (`dist/public`).
 * Register **after** explicit `/healthz` routes on the same app so liveness wins.
 * No DB imports — safe before migrations.
 */
export function attachProductionStatic(app: Express): void {
  if (process.env.NODE_ENV !== "production") return;

  const here = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.resolve(here, "../public");

  app.use(express.static(publicDir, { index: false, maxAge: "1h" }));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}
