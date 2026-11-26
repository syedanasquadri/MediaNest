import { searchUserChunks, SearchResultItem } from "./search.service";
import { GEMINI_API_KEY } from "../config";
import { logger } from "../logger";

export interface ChatSource {
    id: number;
    chunkId: string;
    contentId: string;
    title: string;
    type: string;
    timestamp?: string;
    jumpUrl: string;
    snippet: string;
}

export interface ChatResponse {
    reply: string;
    sources: ChatSource[];
    model: string;
}

export interface ChatHistoryItem {
    role: "user" | "assistant";
    content: string;
}

/**
 * Synthesizes a natural language answer with Gemini 2.5 Flash grounded in user's bookmarks
 */
export async function answerQuestionWithSecondBrain(params: {
    userId: string;
    message: string;
    history?: ChatHistoryItem[];
}): Promise<ChatResponse> {
    const { userId, message, history = [] } = params;

    logger.info({ userId, message }, "[ChatService] Processing user question");

    // 1. Retrieve top matching knowledge chunks from user's Second Brain
    const matches: SearchResultItem[] = await searchUserChunks({
        userId,
        query: message,
        limit: 5,
        minScore: 0.15
    });

    const sources: ChatSource[] = matches.map((m, idx) => ({
        id: idx + 1,
        chunkId: m.chunkId,
        contentId: m.contentId,
        title: m.title,
        type: m.type,
        timestamp: m.timestampFormatted,
        jumpUrl: m.jumpUrl,
        snippet: m.snippet
    }));

    // If no API key is provided, return structured fallback synthesis
    if (!GEMINI_API_KEY) {
        if (matches.length === 0) {
            return {
                reply: "I couldn't find any relevant bookmarks or notes in your Second Brain matching that question. Try adding some YouTube videos or articles first!",
                sources: [],
                model: "local-fallback"
            };
        }

        const fallbackReply = `Here is what I found in your Second Brain:\n\n` +
            matches.map((m, idx) => `**[${idx + 1}] ${m.title}** ${m.timestampFormatted ? `(at ${m.timestampFormatted})` : ""}:\n> "${m.snippet}"`).join("\n\n");

        return {
            reply: fallbackReply,
            sources,
            model: "local-fallback"
        };
    }

    // 2. Format grounding context for Gemini
    let contextText = "No direct bookmark matches were found in your database.";
    if (matches.length > 0) {
        contextText = matches.map((m, idx) => {
            return `[${idx + 1}] Title: "${m.title}" (${m.type}) ${m.timestampFormatted ? `| Timestamp: ${m.timestampFormatted}` : ""}
Jump URL: ${m.jumpUrl}
Transcript Excerpt: "${m.text}"`;
        }).join("\n\n");
    }

    const systemInstruction = `You are NestAI, an intelligent personal Second Brain assistant inside MediaNest.
The user is asking a question about their saved knowledge base (video transcripts, articles, and bookmarks).
Answer clearly, concisely, and insightfully based on the provided excerpts.

Guidelines:
1. Synthesize a direct, helpful answer in fluent natural language.
2. When mentioning a fact or advice from a source, cite it with [1], [2], etc., matching the provided sources.
3. If the sources mention specific video moments or timestamps, reference them clearly so the user knows where to watch.
4. If the saved excerpts do not contain enough info, state what your bookmarks say, then briefly provide helpful general guidance.
5. Format with Markdown (bold keywords, neat bullet points).`;

    const prompt = `Context from user's saved bookmarks:\n${contextText}\n\nUser Question: ${message}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        // Format conversation history for Gemini multi-turn
        const contents = [
            ...history.slice(-4).map(h => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }]
            })),
            {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
            }
        ];

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 800
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Gemini LLM error (${response.status}): ${errBody}`);
        }

        const data: any = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to generate a response from the model.";

        return {
            reply,
            sources,
            model: "gemini-2.5-flash"
        };
    } catch (err: any) {
        logger.error({ err: err?.message }, "[ChatService] Failed to generate response with Gemini");

        // Graceful fallback to retrieval excerpts
        const fallback = matches.length > 0
            ? `Based on your bookmarks:\n\n` + matches.map((m, idx) => `**[${idx + 1}] ${m.title}** (${m.timestampFormatted || "Note"}):\n"${m.snippet}"`).join("\n\n")
            : "I encountered an issue connecting to the AI model. Please try again.";

        return {
            reply: fallback,
            sources,
            model: "retrieval-fallback"
        };
    }
}

