import { searchDocuments } from "@/lib/vector-search"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

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

    const { query, topK = 5 } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: "Missing 'query' parameter" },
        { status: 400 }
      )
    }

    // ⚠️ [แก้เพิ่มเอง] topK วิ่งตรงเข้า SQL LIMIT — ต้อง clamp กันคนส่ง topK: 999999
    const safeTopK = Math.min(Math.max(Number(topK) || 5, 1), 20)

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
