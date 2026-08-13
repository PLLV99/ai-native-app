import { getOpenAIClient } from "@/lib/openai"
import { searchDocuments } from "@/lib/vector-search"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest } from "next/server"

// Simple in-memory rate limit: max 20 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 20) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  // 1. Rate limit (prevents abuse from public users)
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  if (!checkRateLimit(ip)) {
    return new Response("Too Many Requests", { status: 429 })
  }

  // Check session (optional — if logged in, save history; if not, just respond)
  const session = await auth.api.getSession({
    headers: await headers(),
  }).catch(() => null)

  const { message, sessionId } = await request.json()

  // 2. Retrieve Chat History from Database
  let history: { role: "user" | "assistant"; content: string }[] = []
  if (sessionId) {
    const previousMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 20,
    })
    history = previousMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))
  }

  // 3. Search for relevant documents
  const searchResults = await searchDocuments(message, 5)
  const context = searchResults
    .map((doc, i) => `[Document ${i + 1}]\n${doc.content}`)
    .join("\n\n---\n\n")

  // 4. Generate Streaming Response
  const openai = getOpenAIClient()
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are the AI Assistant for Smart Electronic Thailand, responsible for answering questions using shop details, products, and FAQs.\n\n<context>\n${context}\n</context>`,
      },
      ...history,
      { role: "user", content: message },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    stream: true,
  })

  // 5. Send Stream response and accumulate the full answer
  const encoder = new TextEncoder()
  let fullAnswer = ""

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) {
          fullAnswer += content
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
          )
        }
      }

      // 6. Save messages to Database only if user is logged in and sessionId exists
      if (session && sessionId && fullAnswer) {
        await prisma.chatMessage.createMany({
          data: [
            {
              sessionId,
              role: "user",
              content: message,
            },
            {
              sessionId,
              role: "assistant",
              content: fullAnswer,
              sources: searchResults.map((s) => ({
                source: s.metadata?.source,
                similarity: s.similarity,
              })),
            },
          ],
        })
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}