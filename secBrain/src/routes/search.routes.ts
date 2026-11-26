import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/auth.middleware";
import { searchUserChunks } from "../services/search.service";

export const searchRouter = Router();

searchRouter.get("/search", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    const query = (req.query.q as string)?.trim();
    if (!query) {
        res.status(400).json({ message: "Search query parameter 'q' is required" });
        return;
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    try {
        const results = await searchUserChunks({
            userId: req.userId as string,
            query,
            limit
        });

        res.json({
            query,
            count: results.length,
            results
        });
    } catch (err: any) {
        res.status(500).json({
            message: "Failed to perform semantic search",
            error: err?.message || "Unknown error"
        });
    }
});

