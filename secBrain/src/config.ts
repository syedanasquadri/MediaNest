import dotenv from "dotenv";
dotenv.config();

export const JWT_PASSWORD = process.env.JWT_PASSWORD || "fallback_jwt_secret";
export const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/brainly";
export const PORT = Number(process.env.PORT) || 3001;
