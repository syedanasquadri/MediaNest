import { GEMINI_API_KEY, OPENAI_API_KEY } from "../config";
import { TextChunk } from "./chunking.service";
import { ContentChunkModel, ContentModel } from "../models";
import { logger } from "../logger";

export interface IngestionResult {
    savedChunksCount: number;
    vectorDimensions: number;
    provider: "gemini" | "openai" | "local-deterministic";
}

/**
 * Generates a local deterministic pseudo-semantic vector (768 dimensions)
 * when neither Gemini nor OpenAI API keys are provided.
 * Ensures zero-crash offline execution and CI/CD testing.
 */
function generateLocalEmbedding(text: string, dimensions = 768): number[] {
    const vector = new Array(dimensions).fill(0);
    const clean = text.toLowerCase().trim();

    for (let i = 0; i < clean.length; i++) {
        const charCode = clean.charCodeAt(i);
        const idx1 = (charCode * 31 + i) % dimensions;
        const idx2 = (charCode * 17 + i * 7) % dimensions;
        vector[idx1] += Math.sin(charCode + i);
        vector[idx2] += Math.cos(charCode - i);
    }

    // Normalize to unit length (L2 norm)
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => Math.round((v / norm) * 100000) / 100000);
}

/**
 * Generates embeddings via Google Gemini (gemini-embedding-001)
 */
async function generateGeminiEmbeddings(texts: string[]): Promise<number[][]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${GEMINI_API_KEY}`;
    
    const requests = texts.map(text => ({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        outputDimensionality: 768
    }));

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Embedding API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.embeddings.map((emb: any) => emb.values);
}

/**
 * Generates embeddings via OpenAI text-embedding-3-small
 */
async function generateOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
    const url = "https://api.openai.com/v1/embeddings";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            input: texts,
            model: "text-embedding-3-small"
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Embedding API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.data.map((item: any) => item.embedding);
}

/**
 * Universal embedding generator: detects Gemini, OpenAI, or falls back to local.
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<{
    embeddings: number[][];
    provider: "gemini" | "openai" | "local-deterministic";
}> {
    if (!texts || texts.length === 0) {
        return { embeddings: [], provider: "local-deterministic" };
    }

    if (GEMINI_API_KEY) {
        try {
            const embeddings = await generateGeminiEmbeddings(texts);
            return { embeddings, provider: "gemini" };
        } catch (err: any) {
            logger.warn({ err: err?.message }, "[EmbeddingService] Gemini API failed. Falling back to local adapter.");
        }
    }

    if (OPENAI_API_KEY) {
        try {
            const embeddings = await generateOpenAIEmbeddings(texts);
            return { embeddings, provider: "openai" };
        } catch (err: any) {
            logger.warn({ err: err?.message }, "[EmbeddingService] OpenAI API failed. Falling back to local adapter.");
        }
    }

    // Local deterministic fallback
    const embeddings = texts.map(t => generateLocalEmbedding(t, 768));
    return { embeddings, provider: "local-deterministic" };
}

/**
 * Ingests and stores an array of chunks into the MongoDB ContentChunk collection,
 * updating the parent Content bookmark's status to "ready".
 */
export async function ingestAndSaveChunks(params: {
    contentId: string;
    userId: string;
    chunks: TextChunk[];
    sourceType: string;
    fullText?: string;
}): Promise<IngestionResult> {
    const { contentId, userId, chunks, sourceType, fullText = "" } = params;

    if (!chunks || chunks.length === 0) {
        await ContentModel.updateOne(
            { _id: contentId, userId },
            { $set: { ingestionStatus: "ready", rawText: fullText } }
        );
        return { savedChunksCount: 0, vectorDimensions: 0, provider: "local-deterministic" };
    }

    // 1. Delete any existing chunks for this content to prevent duplicates on re-ingestion
    await ContentChunkModel.deleteMany({ contentId, userId });

    // 2. Generate vector embeddings for all chunk texts
    const texts = chunks.map(c => c.text);
    const { embeddings, provider } = await generateBatchEmbeddings(texts);

    // 3. Prepare chunk documents
    const chunkDocs = chunks.map((chunk, idx) => ({
        contentId,
        userId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding: embeddings[idx] || [],
        metadata: {
            sourceType,
            timestamp: chunk.startSeconds,
            endTimestamp: chunk.endSeconds,
            wordCount: chunk.wordCount
        }
    }));

    // 4. Batch insert into MongoDB
    await ContentChunkModel.insertMany(chunkDocs);

    // 5. Update parent Content status to "ready"
    await ContentModel.updateOne(
        { _id: contentId, userId },
        { 
            $set: { 
                ingestionStatus: "ready", 
                rawText: fullText 
            } 
        }
    );

    const vectorDimensions = embeddings[0]?.length || 0;

    return {
        savedChunksCount: chunkDocs.length,
        vectorDimensions,
        provider
    };
}

