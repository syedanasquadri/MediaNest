import { Router, Request, Response } from "express";
import { userMiddleware } from "../middleware/auth.middleware";
import { answerQuestionWithSecondBrain } from "../services/chat.service";

export const chatRouter = Router();

chatRouter.post("/chat", userMiddleware, async (req: Request, res: Response): Promise<void> => {
    const message = req.body.message?.trim();
    if (!message) {
        res.status(400).json({ message: "Field 'message' is required" });
        return;
    }

    const history = Array.isArray(req.body.history) ? req.body.history : [];

    try {
        const result = await answerQuestionWithSecondBrain({
            userId: req.userId as string,
            message,
            history
        });

        res.json(result);
    } catch (err: any) {
        res.status(500).json({
            message: "Failed to generate AI response",
            error: err?.message || "Unknown error"
        });
    }
});

