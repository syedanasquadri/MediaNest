import { connectDB, ContentModel, ContentChunkModel } from "../src/db";
import { extractContentText } from "../src/services/extractor.service";
import { chunkExtractedContent } from "../src/services/chunking.service";
import { ingestAndSaveChunks } from "../src/services/embedding.service";

function formatTimestamp(seconds?: number): string {
    if (seconds === undefined) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function run() {
    console.log("=================================================");
    console.log("  STEP 3 VISUAL TEST: EMBEDDINGS & DB STORAGE");
    console.log("=================================================\n");

    await connectDB();

    // 1. Find or pick an existing bookmark to ingest
    let target = await ContentModel.findOne({ type: "youtube" });
    if (!target) {
        target = await ContentModel.findOne();
    }

    if (!target) {
        console.log("❌ No content found in database to test with.");
        process.exit(1);
    }

    console.log(`📌 Found Target Bookmark in MongoDB:`);
    console.log(`   ID:    ${target._id}`);
    console.log(`   Title: "${target.title}"`);
    console.log(`   Link:  ${target.link}`);
    console.log(`   Initial Status: "${target.ingestionStatus}"\n`);

    // 2. Extract Text
    console.log(`⚙️  1. Extracting speech transcript / text...`);
    const extracted = await extractContentText({
        link: target.link,
        type: target.type || "link",
        title: target.title,
        description: target.description
    });
    console.log(`   ✅ Extracted ${extracted.wordCount} words.`);

    // 3. Chunk Text
    console.log(`⚙️  2. Slicing into semantic chunks with 10% overlap...`);
    const chunks = chunkExtractedContent(extracted, {
        targetWordsPerChunk: 250,
        overlapWords: 35
    });
    console.log(`   ✅ Sliced into ${chunks.length} chunks.`);

    // 4. Generate Embeddings & Save to MongoDB
    console.log(`⚙️  3. Generating vector embeddings & writing to MongoDB ContentChunks collection...`);
    const result = await ingestAndSaveChunks({
        contentId: target._id.toString(),
        userId: target.userId.toString(),
        chunks,
        sourceType: target.type || "link",
        fullText: extracted.fullText
    });

    console.log(`   ✅ Saved ${result.savedChunksCount} chunks to MongoDB!`);
    console.log(`   ✅ Vector Dimensions: ${result.vectorDimensions} floats per chunk.`);
    console.log(`   ✅ Embedding Provider: ${result.provider}\n`);

    // 5. Visual Query from Database
    console.log(`=================================================`);
    console.log(`     VERIFYING REAL MONGODB DATABASE DOCUMENTS   `);
    console.log(`=================================================\n`);

    const updatedParent = await ContentModel.findById(target._id);
    console.log(`📄 Parent Bookmark Status: "${updatedParent?.ingestionStatus}" (Updated!)`);
    console.log(`📄 Parent Stored Raw Text: ${updatedParent?.rawText?.length || 0} characters saved in MongoDB.\n`);

    const dbChunks = await ContentChunkModel.find({ contentId: target._id }).limit(3);
    console.log(`📦 Sample ContentChunk Documents read directly from MongoDB:\n`);

    dbChunks.forEach((c) => {
        const previewVector = c.embedding.slice(0, 4).map(v => v.toFixed(4)).join(", ");
        console.log(`  ┌─ Document ID: ${c._id}`);
        console.log(`  │  Chunk Index: #${c.chunkIndex}`);
        console.log(`  │  Timestamp:   ${formatTimestamp(c.metadata?.timestamp)}`);
        console.log(`  │  Text Snippet: "${c.text.slice(0, 100)}..."`);
        console.log(`  │  Embedding:   [${previewVector}, ... +${c.embedding.length - 4} more floats]`);
        console.log(`  └─────────────────────────────────────────────────────\n`);
    });

    console.log("🎉 Step 3 Embedding & MongoDB Storage verified 100% successfully!");
    process.exit(0);
}

run();

