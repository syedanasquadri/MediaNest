import { ContentChunkModel, ContentModel } from "../models";
import { generateBatchEmbeddings } from "./embedding.service";
import { getYouTubeVideoId } from "./extractor.service";
import { logger } from "../logger";

export interface SearchResultItem {
    chunkId: string;
    contentId: string;
    title: string;
    link: string;
    type: string;
    image?: string | null;
    siteName?: string | null;
    snippet: string;
    text: string;
    startSeconds?: number;
    endSeconds?: number;
    timestampFormatted?: string;
    jumpUrl: string;
    similarityScore: number;
}

function formatTimestamp(seconds?: number): string | undefined {
    if (seconds === undefined || seconds === null) return undefined;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function buildJumpUrl(link: string, type: string, startSeconds?: number): string {
    if (startSeconds !== undefined && startSeconds !== null && (type === "youtube" || getYouTubeVideoId(link))) {
        const separator = link.includes("?") ? "&" : "?";
        return `${link}${separator}t=${startSeconds}s`;
    }
    return link;
}

function extractSnippet(text: string, query: string, maxLength = 140): string {
    if (!text) return "";
    const cleanText = text.replace(/\s+/g, " ").trim();
    if (cleanText.length <= maxLength) return cleanText;

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let matchIndex = -1;
    for (const word of queryWords) {
        const idx = cleanText.toLowerCase().indexOf(word);
        if (idx !== -1) {
            matchIndex = idx;
            break;
        }
    }

    if (matchIndex === -1) {
        return cleanText.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
    }

    const start = Math.max(0, matchIndex - 35);
    const end = Math.min(cleanText.length, start + maxLength);
    let snippet = cleanText.slice(start, end).trim();

    if (start > 0) snippet = "..." + snippet.replace(/^\S*\s+/, "");
    if (end < cleanText.length) snippet = snippet.replace(/\s+\S*$/, "") + "...";

    return snippet;
}

function dotProduct(a: number[], b: number[]): number {
    let dot = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        dot += a[i] * b[i];
    }
    return dot;
}

export async function searchUserChunks(params: {
    userId: string;
    query: string;
    limit?: number;
    minScore?: number;
}): Promise<SearchResultItem[]> {
    const { userId, query, limit = 10, minScore = 0.15 } = params;

    logger.info({ userId, query }, "[SearchService] Executing semantic search");

    // 1. Embed query using active provider (Gemini or local fallback)
    const embeddingResult = await generateBatchEmbeddings([query]);
    if (!embeddingResult.embeddings || embeddingResult.embeddings.length === 0) {
        return [];
    }
    const queryVector = embeddingResult.embeddings[0];

    // 2. Retrieve all vector chunks for this user
    const chunks = await ContentChunkModel.find({ userId })
        .select("_id contentId text metadata embedding")
        .lean();

    if (!chunks || chunks.length === 0) {
        logger.info({ userId }, "[SearchService] No indexed chunks found for user");
        return [];
    }

    // 3. Score chunks using cosine similarity (dot product of normalized vectors)
    const scoredChunks = chunks
        .map((chunk: any) => {
            const similarity = dotProduct(queryVector, chunk.embedding || []);
            return {
                chunk,
                similarity: Math.round(similarity * 1000) / 1000
            };
        })
        .filter((item) => item.similarity >= minScore)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    if (scoredChunks.length === 0) {
        return [];
    }

    // 4. Populate parent bookmark metadata for the top matches
    const contentIds = Array.from(new Set(scoredChunks.map(s => s.chunk.contentId.toString())));
    const contents = await ContentModel.find({ _id: { $in: contentIds }, userId }).lean();
    const contentMap = new Map(contents.map(c => [c._id.toString(), c]));

    // 5. Build rich result items with formatted timestamps and video jump links
    const results: SearchResultItem[] = [];
    for (const { chunk, similarity } of scoredChunks) {
        const parent = contentMap.get(chunk.contentId.toString());
        if (!parent) continue;

        const startSeconds = chunk.metadata?.timestamp;
        const endSeconds = chunk.metadata?.endTimestamp;

        results.push({
            chunkId: chunk._id.toString(),
            contentId: parent._id.toString(),
            title: parent.title,
            link: parent.link,
            type: parent.type,
            image: parent.image,
            siteName: parent.siteName,
            snippet: extractSnippet(chunk.text, query, 140),
            text: chunk.text,
            startSeconds,
            endSeconds,
            timestampFormatted: formatTimestamp(startSeconds),
            jumpUrl: buildJumpUrl(parent.link, parent.type, startSeconds),
            similarityScore: similarity
        });
    }

    logger.info({ userId, matchCount: results.length }, "[SearchService] Semantic search completed");
    return results;
}
