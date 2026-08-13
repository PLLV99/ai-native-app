import { searchDocuments } from "@/lib/vector-search"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { searchSchema, validationError } from "@/lib/validations"
import { rateLimitUser } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // ⚠️ [แก้เพิ่มเอง] ทุก request ที่เข้ามา = ค่า embedding ในบัญชี OpenAI ของเรา
    // ถ้าไม่เช็ค session ใครก็ยิง endpoint นี้รัวๆ ได้ = เงินเราหมด
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // session guard กันคนนอกได้ แต่ใครก็สมัครได้ → ต้องมี rate limit ต่อ user ด้วย
    const limited = await rateLimitUser(session.user.id, "ai-search", 30, 60)
    if (limited) return limited

    // schema clamp topK ให้อยู่ในช่วง 1-20 แล้ว (เดิมใช้ Math.min/max เขียนเอง)
    const parsed = searchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 })
    }
    const { query, topK: safeTopK } = parsed.data

    const results = await searchDocuments(query, safeTopK)

    return NextResponse.json({
      query,
      results: results.map((r) => ({
        id: r.id,
        content: r.content,
        metadata: r.metadata,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
      totalResults: results.length,
    })
  } catch (error: any) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
