import { Router, Request, Response } from "express";
import { fetchPreviewMetadata } from "../services/scraper.service";

export const previewRouter = Router();

previewRouter.get("/preview", async (req: Request, res: Response): Promise<void> => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
        res.status(400).json({ message: "URL parameter is required" });
        return;
    }

    try {
        const preview = await fetchPreviewMetadata(targetUrl);
        res.json(preview);
    } catch (e: any) {
        res.status(422).json({
            message: "Could not fetch preview metadata",
            error: e?.message || "Unknown error"
        });
    }
});

