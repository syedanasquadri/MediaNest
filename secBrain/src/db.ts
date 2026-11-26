import mongoose from "mongoose";
import { MONGO_URL } from "./config";
import { logger } from "./logger";

export async function connectDB(): Promise<void> {
    try {
        await mongoose.connect(MONGO_URL);
        logger.info("MongoDB Connected");
    } catch (err) {
        logger.error({ err }, "MongoDB connection error");
        throw err;
    }
}

// Re-export models for backward compatibility
export * from "./models";
