import rateLimit from "express-rate-limit";
import type { Request } from "express";

const userKey = (req: Request): string => {
  const authedUser = (req as Request & { user?: { id?: string } }).user;
  if (authedUser?.id) return `user:${authedUser.id}`;
  return `ip:${req.ip ?? "unknown"}`;
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userKey,
  /** Probes (e.g. Railway) must never consume quota or trip validation edge cases. */
  skip: (req) => req.path === "/healthz" || req.originalUrl.startsWith("/api/healthz"),
  message: {
    error: "rate_limited",
    message: "Too many requests. Please slow down.",
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userKey,
  message: {
    error: "rate_limited",
    message: "AI request quota reached. Try again in an hour.",
  },
});
