import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    version: "0.1.0",
    service: "MAZALAB Core"
  });
});

export { healthRouter };
