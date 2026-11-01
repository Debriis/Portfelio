import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { apiRoutes } from "./routes/api.js";
import {
  portfolioRepository,
  type PortfolioRepository,
} from "./repositories/portfolio.js";
export function createApp(
  repository: PortfolioRepository = portfolioRepository,
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: env.origins }));
  app.use("/api", apiRoutes(repository));
  app.use((_req, res) =>
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Endpoint not found." } }),
  );
  app.use(((error, _req, res, _next) => {
    console.error(
      "Content could not be loaded:",
      error instanceof Error ? error.message : "unknown",
    );
    res
      .status(500)
      .json({
        error: {
          code: "INTERNAL_ERROR",
          message: "The broadcast is temporarily unavailable.",
        },
      });
  }) as express.ErrorRequestHandler);
  return app;
}
