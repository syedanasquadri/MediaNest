import mongoose from "mongoose";
import { MONGO_URL } from "./config";

export async function connectDB(): Promise<void> {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("MongoDB connection error", err);
        throw err;
    }
}

// Re-export models for backward compatibility
export * from "./models";
