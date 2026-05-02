import path from "node:path";
import { fileURLToPath } from "node:url";

import express, { Router, type Response } from "express";

import { healthRouter } from "./health.js";

/**
 * Repo root: works when this module runs from `src/api/` (tsx) or `dist/api/` (node).
 * `demo/` lives at `<repoRoot>/demo`.
 */
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "..", "..");
const demoRoot = path.resolve(repoRoot, "demo");

const apiRouter = Router();

function sendGamingDashboard(res: Response): void {
  res.sendFile("gaming-dashboard.html", {
    root: demoRoot,
    dotfiles: "deny"
  });
}

apiRouter.get("/", (_req, res) => {
  res.status(200).json({
    message: "MAZALAB API is running.",
    docs: "/health"
  });
});

apiRouter.use("/health", healthRouter);

/** MAZA Shield dashboard — explicit paths so `/demo` always resolves without relying on static index. */
apiRouter.get("/demo", (_req, res) => {
  sendGamingDashboard(res);
});

apiRouter.get("/demo/", (_req, res) => {
  sendGamingDashboard(res);
});

apiRouter.get("/demo/gaming-dashboard.html", (_req, res) => {
  sendGamingDashboard(res);
});

apiRouter.use(
  "/demo",
  express.static(demoRoot, {
    index: false,
    dotfiles: "deny"
  })
);

export { apiRouter };
