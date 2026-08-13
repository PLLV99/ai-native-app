import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/openai";
import { loadDocument } from "@/lib/document-loader";
import { splitTextIntoChunks } from "@/lib/text-splitter";
import path from "path";
import fs from "fs";

// Retry logic for handling OpenAI rate limits (HTTP 429) and quota checks
async function generateEmbeddingWithRetry(
  text: string,
  maxRetries = 3,
): Promise<number[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateEmbedding(text);
    } catch (error: any) {
      // Out of API credits — no point in retrying
      if (error?.code === "insufficient_quota") {
        console.error("\n❌ OpenAI API quota exceeded!");
        console.error(
          "   Please add funds at: https://platform.openai.com/settings/billing",
        );
        process.exit(1);
      }

      // Rate limit encountered — wait and retry with exponential backoff
      if (error?.status === 429 && attempt < maxRetries) {
        const waitMs = 1000 * attempt * 2;
        console.warn(
          `   ⏳ Rate limited — waiting ${waitMs / 1000}s (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      throw error;
    }
  }
  throw new Error("generateEmbedding failed after maximum retries");
}

async function ingestDocument(filePath: string) {
  console.log(`📄 Reading file: ${filePath}`);

  // 1. Load document content
  const document = await loadDocument(filePath);
  console.log(`   ✅ Content loaded: ${document.content.length} characters`);

  // 2. Split content into manageable chunks
  const chunks = splitTextIntoChunks(document.content, {
    chunkSize: 300,
    chunkOverlap: 50,
    source: document.metadata.source,
  });
  console.log(`   📦 Created ${chunks.length} chunks`);

  // 3. Generate Embeddings & store them in pgVector via Raw SQL
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`   🔄 Processing chunk ${i + 1}/${chunks.length}...`);

    const embedding = await generateEmbeddingWithRetry(chunk.content);

    // Convert embedding array into pgVector's expected string format: "[0.1, 0.2, ...]"
    const embeddingStr = `[${embedding.join(",")}]`;

    // Insert directly using Raw SQL (Prisma vector type casting)
    await prisma.$executeRaw`
      INSERT INTO document (id, content, metadata, embedding, "createdAt", "updatedAt")
      VALUES (
        ${`doc_${Date.now()}_${i}`},
        ${chunk.content},
        ${JSON.stringify(chunk.metadata)}::jsonb,
        ${embeddingStr}::vector,
        NOW(),
        NOW()
      )
    `;

    // Delay briefly to avoid triggering rate limits needlessly
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`   ✅ Document successfully ingested!`);
}

async function main() {
  const docsDir = path.join(process.cwd(), "documents");

  // Ensure documents directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    console.log("📁 Created 'documents/' directory.");
    console.log(
      "   Please place TXT, CSV, or PDF files into this folder and re-run.",
    );
    return;
  }

  // Filter supported document types
  const files = fs.readdirSync(docsDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".pdf" || ext === ".txt" || ext === ".csv";
  });

  if (files.length === 0) {
    console.log(
      "❌ No TXT, CSV, or PDF files found in 'documents/' directory.",
    );
    return;
  }

  console.log(`🚀 Starting ingestion pipeline for ${files.length} file(s)\n`);

  // Wipe existing database records to prevent duplicates during re-runs
  const deleted = await prisma.$executeRaw`DELETE FROM document`;
  console.log(`🗑️  Cleared ${deleted} old document record(s)\n`);

  for (const file of files) {
    const filePath = path.join(docsDir, file);
    await ingestDocument(filePath);
    console.log("");
  }

  console.log("🎉 Ingestion complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
