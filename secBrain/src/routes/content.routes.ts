import { Router, Request, Response } from "express";
import { ContentModel, ContentChunkModel } from "../models";
import { userMiddleware } from "../middleware/auth.middleware";
import { resolveUrl } from "../services/scraper.service";
import { triggerIngestion } from "../services/ingestion.service";

export const contentRouter = Router();

contentRouter.post("/content", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    let { title, link, type, description, image, siteName, favicon } = req.body;

    if (!title || !link || !type) {
        res.status(400).json({
            message: "Title, link, and type are required"
        });
        return;
    }

    // Auto-detect and resolve shortlinks / canonical URLs
    if (typeof link === "string") {
        if (link.includes("lnkd.in")) {
            link = await resolveUrl(link);
            type = "linkedin";
        } else if (link.includes("linkedin.com")) {
            type = "linkedin";
        } else if (link.includes("instagram.com") || link.includes("instagr.am")) {
            type = "instagram";
            link = link.split("?")[0].replace(/\/+$/, "");
        }
    }

    const tags = Array.isArray(req.body.tags) 
        ? req.body.tags.filter((t: any) => typeof t === "string") 
        : [];

    const newContent = await ContentModel.create({
        title,
        link,
        type,
        description,
        image,
        siteName,
        favicon,
        userId: req.userId,
        tags
    });

    // Asynchronously trigger background transcript extraction and semantic vectorization
    void triggerIngestion(newContent._id.toString(), req.userId as string);

    res.json({
        message: "Content added",
        contentId: newContent._id
    });
});

// Manual re-trigger of content ingestion / vectorization
contentRouter.post("/content/:contentId/ingest", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    const contentId = req.params.contentId as string;
    if (!contentId) {
        res.status(400).json({ message: "Content ID is required" });
        return;
    }

    const result = await triggerIngestion(contentId, req.userId as string);
    if (!result) {
        res.status(422).json({ message: "Ingestion failed or could not process bookmark" });
        return;
    }

    res.json({
        message: "Ingestion completed",
        result
    });
});

contentRouter.get("/content", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    // Sorted by newest first without redundant join on user's own profile
    const content = await ContentModel.find({
        userId
    }).sort({ createdAt: -1 });

    res.json({
        content
    });
});

contentRouter.delete("/content", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    const contentId = req.body.contentId;

    if (!contentId) {
        res.status(400).json({
            message: "Content ID is required"
        });
        return;
    }

    try {
        const result = await ContentModel.deleteOne({
            _id: contentId,
            userId: req.userId
        });

        if (result.deletedCount === 0) {
            res.status(404).json({
                message: "Content not found or unauthorized"
            });
            return;
        }

        // Clean up any associated vector chunks for this content
        await ContentChunkModel.deleteMany({
            contentId,
            userId: req.userId
        });

        res.json({
            message: "Content Deleted"
        });
    } catch {
        res.status(500).json({
            message: "Failed to delete content"
        });
    }
});

