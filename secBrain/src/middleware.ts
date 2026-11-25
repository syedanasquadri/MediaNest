import { NextFunction, Request, Response } from "express";
import { JWT_PASSWORD } from "./config";
import jwt, { JwtPayload } from "jsonwebtoken";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {   
    const header = req.headers["authorization"];

    if (!header) {
        res.status(403).json({
            message: "You are not signed in"
        });
        return;
    }

    try {
        const decoded = jwt.verify(header as string, JWT_PASSWORD) as JwtPayload;
        if (decoded && decoded.id) {
            req.userId = decoded.id as string;
            next();
        } else {
            res.status(403).json({
                message: "You are not signed in"
            });
        }
    } catch (e) {
        res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};