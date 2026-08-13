import { getOpenAIClient } from "@/lib/openai"
import { searchDocuments, SearchResult } from "@/lib/vector-search"

// Define the structure of chat messages
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

// Structure of the response returned by the RAG function
export interface RAGResponse {
  answer: string
  sources: SearchResult[]
  tokensUsed: number
}

// System Prompt for the RAG Chatbot
const SYSTEM_PROMPT = `You are the AI Assistant for Smart Electronic Thailand, an online smartphone accessories store.
Your duty is to answer questions based ONLY on store information, products, and FAQs.

Working Rules:
1. Answer questions by referring strictly to the provided information (Context).
2. If there is not enough information, reply with: "Sorry, no information related to this question was found in the store's system."
3. Always answer in English, except for technical terms.
4. Keep the answers concise and straight to the point.
5. If there is information from multiple sources, summarize them together.
6. If asked about a product, recommend the product code, name, price, and a short description.

You will receive information from the store documents in the <context> section below.`

export async function generateRAGResponse(
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  topK: number = 5
): Promise<RAGResponse> {
  // 1. Search for relevant documents
  const searchResults = await searchDocuments(userMessage, topK)

  // 2. Create Context from the search results
  const context = searchResults
    .map((doc, i) => `[Document ${i + 1}] (Source: ${doc.metadata?.source || "N/A"}, Relevance: ${Math.round(doc.similarity * 100)}%)\n${doc.content}`)
    .join("\n\n---\n\n")

  // 3. Create Messages for OpenAI
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    // Add Chat History (limited to the 10 most recent messages)
    ...chatHistory.slice(-10),
    {
      role: "user",
      content: `<context>\n${context}\n</context>\n\nQuestion: ${userMessage}`,
    },
  ]

  // 4. Call OpenAI Chat API
  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.3, // Low = focused/direct, High = diverse/creative
    max_tokens: 1000,
  })

  const answer = completion.choices[0]?.message?.content || "Unable to generate a response."

  return {
    answer,
    sources: searchResults,
    tokensUsed: completion.usage?.total_tokens || 0,
  }
}
