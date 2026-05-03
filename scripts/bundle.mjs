#!/usr/bin/env node
import { cp, rm, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

const dist = path.join(repoRoot, "dist");
const distServer = path.join(dist, "server");
const distPublic = path.join(dist, "public");

const apiOut = path.join(repoRoot, "artifacts/api-server/dist");
const uiOut = path.join(repoRoot, "artifacts/valura-ui/dist/public");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(apiOut))) {
    throw new Error(
      `Missing API build output at ${apiOut}. Run 'pnpm run build:api' first.`,
    );
  }
  if (!(await exists(uiOut))) {
    throw new Error(
      `Missing UI build output at ${uiOut}. Run 'pnpm run build:ui' first.`,
    );
  }

  await rm(dist, { recursive: true, force: true });
  await mkdir(distServer, { recursive: true });
  await mkdir(distPublic, { recursive: true });

  await cp(apiOut, distServer, { recursive: true });
  await cp(uiOut, distPublic, { recursive: true });

  console.log(`bundled to ${dist}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
