import express, { type Express } from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { apiLimiter } from "./middlewares/rate-limit";
import { logger } from "./lib/logger";

/** Full middleware + API + static SPA (call after DB migrations in production bootstrap). */
export function attachMainApplication(app: Express): void {
  const isProduction = process.env.NODE_ENV === "production";
  const publicUrl = process.env.PUBLIC_URL;

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const corsOrigin = isProduction
    ? publicUrl
      ? [publicUrl]
      : false
    : ["http://localhost:5173", "http://localhost:5174"];

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiLimiter, router);

  if (isProduction) {
    const publicDir = path.resolve(__dirname, "../public");
    app.use(express.static(publicDir, { index: false, maxAge: "1h" }));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }
}

/** Single-shot app for tests / tooling. */
export default function createApplication(): Express {
  const app = express();
  attachMainApplication(app);
  return app;
}
