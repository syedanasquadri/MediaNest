import pino from "pino";
import { LOG_LEVEL, NODE_ENV } from "./config";

export const logger = pino({
    level: LOG_LEVEL,
    transport: NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
                ignore: "pid,hostname"
            }
        }
        : undefined
});

