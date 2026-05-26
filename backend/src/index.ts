import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { aiRouter } from "./routes/ai.route.js";
import { clothingRouter } from "./routes/clothing.route.js";
import { generationRouter } from "./routes/generation.route.js";
import { replicateRouter } from "./routes/replicate.route.js";
import { uploadRouter } from "./routes/upload.route.js";
import { logStartupBanner } from "./utils/log-startup.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
  }),
);
app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/upload", uploadRouter);
app.use("/api/ai", aiRouter);
app.use("/api/replicate", replicateRouter);
app.use("/api/clothing", clothingRouter);
app.use("/api/generate", generationRouter);

app.listen(config.port, () => {
  logStartupBanner();
});
