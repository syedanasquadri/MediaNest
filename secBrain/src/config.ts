import dotenv from "dotenv";
dotenv.config();

export const JWT_PASSWORD = process.env.JWT_PASSWORD || "fallback_jwt_secret";
export const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/brainly";
export const PORT = Number(process.env.PORT) || 3001;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Optional AI Embedding API keys
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
