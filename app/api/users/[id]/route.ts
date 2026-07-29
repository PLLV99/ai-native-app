// app/api/users/[id]/route.ts
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// GET /api/users/:id
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // ตัวอย่าง: ดึง user จาก Prisma
    // const user = await prisma.user.findUnique({ where: { id } })
    return NextResponse.json({
        user: { id, name: "John Doe", email: "john@example.com" },
    })
}

// DELETE /api/users/:id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // ลบ user เป็นงานที่ย้อนกลับไม่ได้ → ต้องเป็น Admin เท่านั้น
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // รองรับ multi-role เช่น "admin,manager"
    const userRoles = (session.user.role ?? "user")
        .split(",")
        .map((r: string) => r.trim())

    if (!userRoles.includes("admin")) {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        )
    }

    const { id } = await params

    // ตัวอย่าง: ลบ user ใน Prisma
    // await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: `User ${id} deleted` })
}
