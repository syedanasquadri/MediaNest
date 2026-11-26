import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { PORT } from "./config";
import { connectDB } from "./db";
import { logger } from "./logger";
import { authRouter } from "./routes/auth.routes";
import { contentRouter } from "./routes/content.routes";
import { previewRouter } from "./routes/preview.routes";
import { shareRouter } from "./routes/share.routes";

const app = express();

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(cors());

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1", authRouter);
app.use("/api/v1", contentRouter);
app.use("/api/v1", previewRouter);
app.use("/api/v1", shareRouter);

// Start server after DB connection
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            logger.info(`MediaNest Backend listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error({ err }, "Failed to start server due to DB connection error");
        process.exit(1);
    });

export default app;