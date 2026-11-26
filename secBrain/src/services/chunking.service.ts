import { TranscriptItem, ExtractedContent } from "./extractor.service";

export interface TextChunk {
    chunkIndex: number;
    text: string;
    wordCount: number;
    startSeconds?: number;
    endSeconds?: number;
}

export interface ChunkingOptions {
    targetWordsPerChunk?: number; // default: 250 words (~1,200 chars)
    overlapWords?: number;        // default: 35 words (~10-15% overlap)
    maxCharsPerChunk?: number;    // default: 1500 chars
    overlapChars?: number;        // default: 150 chars
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
    targetWordsPerChunk: 250,
    overlapWords: 35,
    maxCharsPerChunk: 1500,
    overlapChars: 150
};

/**
 * Slices timestamped YouTube transcripts into cohesive passages
 * while preserving exact start/end seconds and rolling overlap.
 */
export function chunkTranscript(
    transcript: TranscriptItem[],
    options: ChunkingOptions = {}
): TextChunk[] {
    if (!transcript || transcript.length === 0) return [];

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const chunks: TextChunk[] = [];

    let currentItems: TranscriptItem[] = [];
    let currentWords = 0;
    let chunkIndex = 0;

    for (let i = 0; i < transcript.length; i++) {
        const item = transcript[i];
        const itemWords = item.text.split(/\s+/).filter(Boolean).length;

        currentItems.push(item);
        currentWords += itemWords;

        // When target size is reached or at end of transcript
        if (currentWords >= opts.targetWordsPerChunk || i === transcript.length - 1) {
            const chunkText = currentItems.map(it => it.text).join(" ").trim();
            const startSeconds = currentItems[0].startSeconds;
            const lastItem = currentItems[currentItems.length - 1];
            const endSeconds = lastItem.startSeconds + lastItem.durationSeconds;

            if (chunkText) {
                chunks.push({
                    chunkIndex,
                    text: chunkText,
                    wordCount: currentWords,
                    startSeconds,
                    endSeconds
                });
                chunkIndex++;
            }

            // Calculate overlap for the next chunk: keep the last N items whose words sum to ~overlapWords
            if (i < transcript.length - 1) {
                const overlapItems: TranscriptItem[] = [];
                let overlapWordSum = 0;

                for (let j = currentItems.length - 1; j >= 0; j--) {
                    const prevItem = currentItems[j];
                    const wCount = prevItem.text.split(/\s+/).filter(Boolean).length;
                    if (overlapWordSum + wCount <= opts.overlapWords || overlapItems.length === 0) {
                        overlapItems.unshift(prevItem);
                        overlapWordSum += wCount;
                    } else {
                        break;
                    }
                }

                currentItems = overlapItems;
                currentWords = overlapWordSum;
            } else {
                currentItems = [];
                currentWords = 0;
            }
        }
    }

    return chunks;
}

/**
 * Recursively splits long text (articles, blogs) along natural paragraph,
 * sentence, and word boundaries with character-level overlap.
 */
export function chunkArticleText(
    text: string,
    options: ChunkingOptions = {}
): TextChunk[] {
    if (!text || !text.trim()) return [];

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cleanText = text.replace(/\r\n/g, "\n").trim();

    // If the text is short enough, return as a single chunk
    if (cleanText.length <= opts.maxCharsPerChunk) {
        return [{
            chunkIndex: 0,
            text: cleanText,
            wordCount: cleanText.split(/\s+/).filter(Boolean).length
        }];
    }

    const chunks: TextChunk[] = [];
    let start = 0;
    let chunkIndex = 0;

    while (start < cleanText.length) {
        let end = start + opts.maxCharsPerChunk;

        if (end >= cleanText.length) {
            end = cleanText.length;
        } else {
            // Find natural break points in priority: paragraph (\n\n) -> newline (\n) -> period (. ) -> space ( )
            const searchWindow = cleanText.substring(start, end);

            const lastParagraph = searchWindow.lastIndexOf("\n\n");
            const lastNewline = searchWindow.lastIndexOf("\n");
            const lastPeriod = searchWindow.lastIndexOf(". ");
            const lastSpace = searchWindow.lastIndexOf(" ");

            if (lastParagraph > opts.maxCharsPerChunk * 0.6) {
                end = start + lastParagraph + 2;
            } else if (lastPeriod > opts.maxCharsPerChunk * 0.6) {
                end = start + lastPeriod + 2;
            } else if (lastNewline > opts.maxCharsPerChunk * 0.6) {
                end = start + lastNewline + 1;
            } else if (lastSpace > opts.maxCharsPerChunk * 0.5) {
                end = start + lastSpace + 1;
            }
        }

        const chunkText = cleanText.substring(start, end).trim();
        if (chunkText) {
            chunks.push({
                chunkIndex,
                text: chunkText,
                wordCount: chunkText.split(/\s+/).filter(Boolean).length
            });
            chunkIndex++;
        }

        if (end >= cleanText.length) break;

        // Slide start forward, accounting for overlap
        start = Math.max(start + 1, end - opts.overlapChars);
    }

    return chunks;
}

/**
 * Universal router: chunks either transcript items (with timestamps)
 * or general article text.
 */
export function chunkExtractedContent(
    extracted: ExtractedContent,
    options: ChunkingOptions = {}
): TextChunk[] {
    if (extracted.sourceType === "youtube" && extracted.transcript && extracted.transcript.length > 0) {
        return chunkTranscript(extracted.transcript, options);
    }

    return chunkArticleText(extracted.fullText, options);
}

