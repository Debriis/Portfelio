import { Router } from "express";
import type { PortfolioRepository } from "../repositories/portfolio.js";
export function apiRoutes(repository: PortfolioRepository) {
  const router = Router();
  router.get("/health", (_req, res) => res.json({ status: "ok" }));
  router.get("/profile", async (_req, res) =>
    res.json((await repository.read()).profile),
  );
  router.get("/projects", async (_req, res) =>
    res.json((await repository.read()).projects),
  );
  router.get("/projects/:id", async (req, res) => {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.id) ||
      req.params.id.length > 80
    ) {
      res
        .status(400)
        .json({
          error: { code: "INVALID_ID", message: "Use a valid project ID." },
        });
      return;
    }
    const project = (await repository.read()).projects.find(
      (p) => p.id === req.params.id,
    );
    if (!project) {
      res
        .status(404)
        .json({
          error: { code: "NOT_FOUND", message: "This channel does not exist." },
        });
      return;
    }
    res.json(project);
  });
  return router;
}
