import { getOpenAIClient } from "@/lib/openai"
import { searchDocuments } from "@/lib/vector-search"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { chatSchema, validationError } from "@/lib/validations"
import { getClientIp, rateLimitIp, rateLimitUser } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  // Check session (optional — if logged in, save history; if not, just respond)
  const session = await auth.api.getSession({
    headers: await headers(),
  }).catch(() => null)

  // 1. Rate limit. This endpoint answers anonymous visitors too, so fall back
  //    to IP when there is no session — but keep the anonymous budget smaller,
  //    since an IP costs an attacker nothing to rotate.
  //    Backed by the database, not a Map: on serverless every request can land
  //    on a fresh instance, which would leave an in-memory counter always empty.
  const limited = session
    ? await rateLimitUser(session.user.id, "ai-stream", 20, 60)
    : await rateLimitIp(request, "ai-stream-anon", 8, 60)
  if (limited) return limited

  // 2. Validate before spending any OpenAI credits on the request
  const parsed = chatSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 })
  }
  const { message, sessionId } = parsed.data

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