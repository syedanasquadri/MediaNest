import { extractContentText } from "../src/services/extractor.service";
import { chunkExtractedContent } from "../src/services/chunking.service";

function formatTimestamp(seconds: number = 0): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function run() {
    console.log("=================================================");
    console.log("    STEP 2 VISUAL TEST: SEMANTIC CHUNKING ENGINE");
    console.log("=================================================\n");

    // Test 1: YouTube Video Chunking with Timestamps
    const youtubeUrl = process.argv[2] || "https://www.youtube.com/watch?v=kqtD5dpn9C8";
    console.log(`🎬 1. Extracting & Chunking YouTube Video: ${youtubeUrl}...`);

    try {
        const extracted = await extractContentText({
            link: youtubeUrl,
            type: "youtube",
            title: "Python Tutorial"
        });

        console.log(`   ➔ Raw Video Speech: ${extracted.wordCount} words extracted.`);

        const chunks = chunkExtractedContent(extracted, {
            targetWordsPerChunk: 250,
            overlapWords: 35
        });

        console.log(`✅ Chunking Complete: Sliced into ${chunks.length} semantic chunks!\n`);
        console.log("--- Visual Inspection of First 3 Chunks ---");

        chunks.slice(0, 3).forEach((chunk) => {
            const timeRange = `[${formatTimestamp(chunk.startSeconds)} ➔ ${formatTimestamp(chunk.endSeconds)}]`;
            console.log(`\n📌 Chunk #${chunk.chunkIndex} ${timeRange} — (${chunk.wordCount} words):`);
            console.log(`   "${chunk.text.slice(0, 180)}..."`);
        });

        console.log("\n-------------------------------------------");

        // Verify Overlap between Chunk 0 and Chunk 1
        if (chunks.length >= 2) {
            console.log("\n🔍 Visual Overlap Verification (Between Chunk #0 and Chunk #1):");
            const chunk0End = chunks[0].text.slice(-80);
            const chunk1Start = chunks[1].text.slice(0, 80);
            console.log(`   Chunk #0 END:   "...${chunk0End}"`);
            console.log(`   Chunk #1 START: "${chunk1Start}..."`);
            console.log("   (Notice the seamless transition so context is never cut in half!)");
        }
        console.log("-------------------------------------------\n");

    } catch (err: any) {
        console.error("❌ YouTube chunking error:", err.message);
    }

    // Test 2: Article Chunking
    const articleUrl = "https://danluu.com/productivity-velocity/";
    console.log(`📖 2. Extracting & Chunking Article: ${articleUrl}...`);

    try {
        const extracted = await extractContentText({
            link: articleUrl,
            type: "link",
            title: "Productivity Velocity"
        });

        console.log(`   ➔ Raw Article Body: ${extracted.wordCount} words.`);

        const articleChunks = chunkExtractedContent(extracted, {
            maxCharsPerChunk: 1200,
            overlapChars: 150
        });

        console.log(`✅ Chunking Complete: Sliced into ${articleChunks.length} paragraph chunks!\n`);
        console.log("--- First 2 Article Chunks ---");
        articleChunks.slice(0, 2).forEach((chunk) => {
            console.log(`\n📄 Chunk #${chunk.chunkIndex} (${chunk.wordCount} words / ${chunk.text.length} chars):`);
            console.log(`   "${chunk.text.slice(0, 160)}..."`);
        });
        console.log("\n------------------------------");

    } catch (err: any) {
        console.error("❌ Article chunking error:", err.message);
    }

    console.log("\n🎉 Step 2 Semantic Chunking test completed successfully!");
    process.exit(0);
}

run();

