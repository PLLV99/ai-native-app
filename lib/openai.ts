import OpenAI from "openai";

// Lazily create the OpenAI client to avoid throwing during module evaluation —
// Next.js loads every route at build time ("Collecting page data"), and the SDK
// constructor throws if OPENAI_API_KEY is not set. Creating the client only when
// it's actually called keeps the build free of runtime-only env vars.
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY environment variable. Set it before calling OpenAI client functions.",
    );
  }

  return new OpenAI({ apiKey });
}

// Create an embedding vector from text
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}
