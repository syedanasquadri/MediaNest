import { ContentModel } from "../models";
import { extractYouTubeTranscript, extractArticleContent, getYouTubeVideoId } from "./extractor.service";
import { chunkExtractedContent } from "./chunking.service";
import { ingestAndSaveChunks, IngestionResult } from "./embedding.service";
import { logger } from "../logger";

export async function triggerIngestion(contentId: string, userId: string): Promise<IngestionResult | null> {
    try {
        const content = await ContentModel.findOne({ _id: contentId, userId });
        if (!content) {
            logger.warn({ contentId, userId }, "[IngestionService] Bookmark not found for ingestion");
            return null;
        }

        const link = content.link;
        const isYouTube = content.type === "youtube" || Boolean(getYouTubeVideoId(link));
        const isArticle = content.type === "article" || link.startsWith("http");

        if (!isYouTube && content.type !== "article") {
            // Social embeds without transcripts (Twitter, Instagram) - skip extraction
            await ContentModel.updateOne(
                { _id: contentId },
                { $set: { ingestionStatus: "skipped" } }
            );
            logger.info({ contentId, type: content.type }, "[IngestionService] Skipped ingestion for non-text type");
            return null;
        }

        // Set status to processing
        await ContentModel.updateOne(
            { _id: contentId },
            { $set: { ingestionStatus: "processing" } }
        );

        logger.info({ contentId, isYouTube, link }, "[IngestionService] Starting background content ingestion");

        let extracted;
        if (isYouTube) {
            extracted = await extractYouTubeTranscript(link);
        } else {
            extracted = await extractArticleContent(link);
        }

        if (!extracted || !extracted.fullText || extracted.wordCount === 0) {
            await ContentModel.updateOne(
                { _id: contentId },
                { $set: { ingestionStatus: "failed" } }
            );
            logger.warn({ contentId, link }, "[IngestionService] Extractor returned empty text");
            return null;
        }

        // Slices content into semantic chunks
        const chunks = chunkExtractedContent(extracted);
        if (chunks.length === 0) {
            await ContentModel.updateOne(
                { _id: contentId },
                { $set: { ingestionStatus: "failed" } }
            );
            return null;
        }

        // Vectorize and save chunks into MongoDB
        const result = await ingestAndSaveChunks({
            contentId,
            userId,
            chunks,
            sourceType: extracted.sourceType,
            fullText: extracted.fullText
        });

        logger.info({
            contentId,
            savedChunks: result.savedChunksCount,
            provider: result.provider
        }, "[IngestionService] Ingestion completed successfully");

        return result;
    } catch (err: any) {
        logger.error({ contentId, err: err?.message }, "[IngestionService] Failed to ingest bookmark");
        await ContentModel.updateOne(
            { _id: contentId },
            { $set: { ingestionStatus: "failed" } }
        ).catch(() => {});
        return null;
    }
}
