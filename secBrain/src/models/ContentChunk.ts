import mongoose, { Schema, model } from "mongoose";

const contentChunkSchema = new Schema({
    contentId: { type: mongoose.Types.ObjectId, ref: "Content", required: true, index: true },
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] }, // Array of float numbers for vector search
    metadata: {
        sourceType: String,
        timestamp: Number, // Start seconds for YouTube playback
        author: String
    }
}, { timestamps: true });

// Multi-tenant compound index ensuring tenant-isolated vector filtering
contentChunkSchema.index({ userId: 1, contentId: 1 });

export const ContentChunkModel = model("ContentChunk", contentChunkSchema);

