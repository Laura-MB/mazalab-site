import express, {
  type NextFunction,
  type Request,
  type Response
} from "express";

import { apiRouter } from "./api/index.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use("/", apiRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Route does not exist."
  });
});

// Centralized fallback for unexpected runtime errors.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message =
    error instanceof Error ? error.message : "Unexpected internal error.";

  res.status(500).json({
    error: "Internal Server Error",
    message
  });
});

app.listen(port, () => {
  console.log(`MAZALab Core API running on port ${port}`);
});
