import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/openai";
import { splitTextIntoChunks } from "@/lib/text-splitter";

// Retry logic for OpenAI rate limiting (429)
async function generateEmbeddingWithRetry(
  text: string,
  maxRetries = 3,
): Promise<number[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateEmbedding(text);
    } catch (error: any) {
      if (error?.code === "insufficient_quota") {
        throw new Error(
          "OpenAI API quota exceeded! Please top up at https://platform.openai.com/settings/billing",
        );
      }

      if (error?.status === 429 && attempt < maxRetries) {
        const waitMs = 1000 * attempt * 2;
        console.warn(
          `⏳ Rate limited — waiting ${waitMs / 1000} seconds (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      throw error;
    }
  }
  throw new Error("generateEmbedding failed after max retries");
}

/**
 * Ingest text content into Vector DB
 * Splits content into chunks → generates embeddings → saves to pgVector
 */
export async function ingestText(
  content: string,
  options: {
    source?: string;
    documentId?: string;
  } = {},
) {
  const { source = "unknown", documentId } = options;

  // 1. Split into chunks
  const chunks = splitTextIntoChunks(content, {
    chunkSize: 300,
    chunkOverlap: 50,
    source,
  });

  console.log(`📦 Split into ${chunks.length} chunks from "${source}"`);

  // 2. Generate Embedding and save to Database
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}...`);

    // Generate Embedding (with retry logic)
    const embedding = await generateEmbeddingWithRetry(chunk.content);

    // Format embedding array as string required by pgVector
    const embeddingStr = `[${embedding.join(",")}]`;

    // Save to Database using Raw SQL
    await prisma.$executeRaw`
      INSERT INTO document (id, content, metadata, embedding, "createdAt", "updatedAt")
      VALUES (
        ${`doc_${Date.now()}_${i}`},
        ${chunk.content},
        ${JSON.stringify({ ...chunk.metadata, documentId })}::jsonb,
        ${embeddingStr}::vector,
        NOW(),
        NOW()
      )
    `;

    // Delay to prevent hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(
    `✅ Ingestion of "${source}" completed (${chunks.length} chunks)`,
  );
}
