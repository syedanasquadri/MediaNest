import { Router, Request, Response } from "express";
import { LinkModel, ContentModel, UserModel } from "../models";
import { userMiddleware } from "../middleware/auth.middleware";
import { random } from "../utils";

export const shareRouter = Router();

shareRouter.post("/brain/share", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    const share = req.body.share;
    try {
        if (share) {
            const existingLink = await LinkModel.findOne({
                userId: req.userId
            });
            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                });
                return;
            }
            const hash = random(10);
            await LinkModel.create({
                userId: req.userId,
                hash
            });

            res.json({
                hash,
                message: "/share/" + hash
            });
            return;
        } else {
            await LinkModel.deleteOne({
                userId: req.userId
            });
            res.json({
                message: "Removed link"
            });
            return;
        }
    } catch {
        res.status(500).json({
            message: "Failed to update share link"
        });
    }
});

shareRouter.get("/brain/:shareLink", async (req: Request, res: Response): Promise<void> => {
    const hash = req.params.shareLink;

    try {
        const link = await LinkModel.findOne({ hash });

        if (!link) {
            res.status(404).json({
                message: "Share link not found"
            });
            return;
        }

        const [content, user] = await Promise.all([
            ContentModel.find({ userId: link.userId }).sort({ createdAt: -1 }),
            UserModel.findById(link.userId).select("username")
        ]);

        if (!user) {
            res.status(404).json({
                message: "User not found"
            });
            return;
        }

        res.json({
            username: user.username,
            content
        });
    } catch {
        res.status(500).json({
            message: "Failed to fetch shared brain"
        });
    }
});

