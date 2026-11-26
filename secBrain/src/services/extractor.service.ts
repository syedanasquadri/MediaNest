import { YoutubeTranscript } from "youtube-transcript";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export interface TranscriptItem {
    text: string;
    startSeconds: number;
    durationSeconds: number;
}

export interface ExtractedContent {
    fullText: string;
    transcript?: TranscriptItem[];
    wordCount: number;
    sourceType: "youtube" | "article" | "social";
}

const BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|shorts|live)\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

export async function extractYouTubeTranscript(url: string): Promise<ExtractedContent> {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        throw new Error("Invalid YouTube URL: could not find video ID");
    }

    try {
        let rawItems;
        try {
            // Prioritize English captions if available
            rawItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
        } catch {
            // Fallback to whatever default language track YouTube provides
            rawItems = await YoutubeTranscript.fetchTranscript(videoId);
        }

        if (!rawItems || rawItems.length === 0) {
            throw new Error("No transcript found for this video");
        }

        const transcript: TranscriptItem[] = rawItems.map((item) => ({
            text: item.text.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim(),
            startSeconds: Math.floor(item.offset / 1000),
            durationSeconds: Math.round(item.duration / 1000)
        }));

        const fullText = transcript.map(t => t.text).join(" ");
        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        return {
            fullText,
            transcript,
            wordCount,
            sourceType: "youtube"
        };
    } catch (err: any) {
        throw new Error(`Failed to extract YouTube transcript: ${err?.message || "Captions unavailable"}`);
    }
}

export async function extractArticleContent(url: string): Promise<ExtractedContent> {
    try {
        const response = await fetch(url, {
            headers: { "user-agent": BROWSER_USER_AGENT }
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) {
            throw new Error("Could not parse article body with Readability");
        }

        const fullText = article.textContent.replace(/\s+/g, " ").trim();
        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        return {
            fullText,
            wordCount,
            sourceType: "article"
        };
    } catch (err: any) {
        throw new Error(`Failed to extract article content: ${err?.message || "Page unreadable"}`);
    }
}

export async function extractContentText(payload: {
    link: string;
    type: string;
    title?: string;
    description?: string;
}): Promise<ExtractedContent> {
    const { link, type, title = "", description = "" } = payload;

    if (type === "youtube" || link.includes("youtu.be") || link.includes("youtube.com")) {
        try {
            return await extractYouTubeTranscript(link);
        } catch {
            // Fallback to title and description if captions are disabled or unavailable
            const fallbackText = `${title}. ${description}`.trim();
            return {
                fullText: fallbackText,
                wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
                sourceType: "youtube"
            };
        }
    }

    if (type === "link") {
        try {
            return await extractArticleContent(link);
        } catch {
            // Fallback to title and description
            const fallbackText = `${title}. ${description}`.trim();
            return {
                fullText: fallbackText,
                wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
                sourceType: "article"
            };
        }
    }

    // For LinkedIn, Instagram, Twitter
    const socialText = `${title}. ${description}`.trim();
    return {
        fullText: socialText,
        wordCount: socialText.split(/\s+/).filter(Boolean).length,
        sourceType: "social"
    };
}

