import pino from "pino";

/**
 * Only enable pino-pretty in explicit local dev. If NODE_ENV is unset (common on some hosts),
 * default to JSON logs — otherwise `require('pino-pretty')` can throw when devDependencies
 * are omitted from the runtime image.
 */
const usePrettyTransport =
  process.env.NODE_ENV === "development" && process.env.LOG_PRETTY !== "false";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(usePrettyTransport
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});
