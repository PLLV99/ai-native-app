import { SearchResult } from "./vector-search";

export interface ContextConfig {
  maxTokens?: number; // Limit tokens for context
  minSimilarity?: number; // Minimum similarity threshold
  maxDocuments?: number; // Limit number of documents
}

export function buildContext(
  documents: SearchResult[],
  config: ContextConfig = {},
): string {
  const { maxTokens = 3000, minSimilarity = 0.5, maxDocuments = 5 } = config;

  // 1. Filter documents with low similarity
  const relevantDocs = documents.filter(
    (doc) => doc.similarity >= minSimilarity,
  );

  // 2. Limit the number of documents
  const limitedDocs = relevantDocs.slice(0, maxDocuments);

  // 3. Build context with token limit
  let context = "";
  let estimatedTokens = 0;

  for (const doc of limitedDocs) {
    // Estimate tokens (1 token ≈ 4 English characters, 1-2 Thai characters)
    const docTokens = Math.ceil(doc.content.length / 2);

    if (estimatedTokens + docTokens > maxTokens) break;

    context += `[Source: ${doc.metadata?.source || "N/A"}]\n${doc.content}\n\n---\n\n`;
    estimatedTokens += docTokens;
  }

  return context.trim();
}
