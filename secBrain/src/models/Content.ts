import mongoose, { Schema, model } from "mongoose";

const contentSchema = new Schema({
    title: { type: String, required: true },
    link: { type: String, required: true },
    type: { type: String, default: "link" },
    description: String,
    image: String,
    siteName: String,
    favicon: String,
    tags: { type: [String], default: [], index: true },
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
    // AI Ingestion & Search fields (ready for Feature 1 & 2)
    ingestionStatus: {
        type: String,
        enum: ["idle", "pending", "processing", "ready", "failed"],
        default: "idle",
        index: true
    },
    rawText: { type: String, default: "" },
    summary: { type: String, default: "" }
}, { timestamps: true });

// Compound index for user content sorted by recency
contentSchema.index({ userId: 1, createdAt: -1 });

export const ContentModel = model("Content", contentSchema);

