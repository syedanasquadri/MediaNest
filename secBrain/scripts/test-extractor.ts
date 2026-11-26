import { extractContentText } from "../src/services/extractor.service";

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function run() {
    console.log("=================================================");
    console.log("   STEP 1 VISUAL TEST: TEXT & TRANSCRIPT EXTRACTOR");
    console.log("=================================================\n");

    // Test 1: YouTube Video
    const youtubeUrl = process.argv[2] || "https://www.youtube.com/watch?v=1ie4NCszbKQ";
    console.log(`🎬 1. Extracting YouTube Video: ${youtubeUrl}...`);
    try {
        const ytResult = await extractContentText({
            link: youtubeUrl,
            type: "youtube",
            title: "Sample YouTube Video"
        });

        console.log(`✅ Success! Total Words Extracted: ${ytResult.wordCount} words`);
        console.log(`📝 Total Timestamped Entries: ${ytResult.transcript?.length || 0} snippets\n`);
        console.log("--- First 5 Transcript Segments ---");
        (ytResult.transcript || []).slice(0, 5).forEach((item, idx) => {
            console.log(`  [${formatTimestamp(item.startSeconds)}] (#${idx + 1}): "${item.text}"`);
        });
        console.log("------------------------------------\n");
    } catch (err: any) {
        console.error("❌ YouTube extraction error:", err.message);
    }

    // Test 2: Web Article
    const articleUrl = "https://danluu.com/productivity-velocity/";
    console.log(`📖 2. Extracting Web Article: ${articleUrl}...`);
    try {
        const artResult = await extractContentText({
            link: articleUrl,
            type: "link",
            title: "Productivity Velocity"
        });

        console.log(`✅ Success! Total Words Extracted: ${artResult.wordCount} words`);
        console.log("\n--- Article Body Preview (First 250 Chars) ---");
        console.log(`"${artResult.fullText.slice(0, 250)}..."`);
        console.log("----------------------------------------------\n");
    } catch (err: any) {
        console.error("❌ Article extraction error:", err.message);
    }

    console.log("🎉 Step 1 extraction test completed successfully!");
    process.exit(0);
}

run();

