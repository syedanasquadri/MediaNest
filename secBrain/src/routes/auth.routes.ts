import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel, ContentModel } from "../models";
import { JWT_PASSWORD } from "../config";
import { userMiddleware } from "../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/signup", async (req: Request, res: Response): Promise<void> => {
    const rawUsername = req.body.username;
    const password = req.body.password;

    if (!rawUsername || !password) {
        res.status(400).json({
            message: "Username and password are required"
        });
        return;
    }

    const username = rawUsername.trim();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({
            username,
            password: hashedPassword
        });

        res.json({
            message: "User signed up"
        });
    } catch {
        res.status(409).json({
            message: "User already exists"
        });
    }
});

authRouter.post("/signin", async (req: Request, res: Response): Promise<void> => {
    const rawUsername = req.body.username;
    const password = req.body.password;

    if (!rawUsername || !password) {
        res.status(400).json({
            message: "Username and password are required"
        });
        return;
    }

    const username = rawUsername.trim();

    try {
        // Case-insensitive lookup so "anas" matches "Anas"
        const existingUser = await UserModel.findOne({
            username: { $regex: new RegExp(`^${username}$`, "i") }
        });

        if (!existingUser || !existingUser.password) {
            res.status(403).json({
                message: "Wrong username or password"
            });
            return;
        }

        // Support both bcrypt hashes and legacy plaintext passwords
        let isPasswordCorrect = false;
        if (existingUser.password.startsWith("$2b$") || existingUser.password.startsWith("$2a$")) {
            isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        } else {
            // Legacy plaintext fallback: verify and auto-upgrade to bcrypt
            if (password === existingUser.password) {
                isPasswordCorrect = true;
                existingUser.password = await bcrypt.hash(password, 10);
                await existingUser.save();
            }
        }

        if (!isPasswordCorrect) {
            res.status(403).json({
                message: "Wrong username or password"
            });
            return;
        }

        const token = jwt.sign({
            id: existingUser._id
        }, JWT_PASSWORD);

        res.json({
            token
        });
    } catch {
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

authRouter.get("/me", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await UserModel.findById(req.userId).select("-password");
        if (!user) {
            res.status(404).json({
                message: "User not found"
            });
            return;
        }

        const contentCount = await ContentModel.countDocuments({
            userId: req.userId
        });

        res.json({
            username: user.username,
            userId: user._id,
            contentCount
        });
    } catch {
        res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
});

