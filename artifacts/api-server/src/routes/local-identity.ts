import { Router, type IRouter } from "express";
import * as os from "node:os";

const router: IRouter = Router();

/**
 * Exposes the workstation OS username for local dev only (the user running the API process).
 * Production returns null so deploy targets don't show container users like `root`.
 */
router.get("/local-identity", (_req, res) => {
  const dev =
    process.env.NODE_ENV === "development" ||
    process.env.VALURA_SHOW_TERMINAL_NAME === "true";

  if (!dev) {
    res.json({ signInName: null });
    return;
  }

  let signInName: string | null = null;
  try {
    signInName = os.userInfo().username ?? null;
  } catch {
    signInName = null;
  }
  if (!signInName) {
    signInName = process.env.USER ?? process.env.LOGNAME ?? process.env.USERNAME ?? null;
  }

  res.json({ signInName });
});

export default router;
