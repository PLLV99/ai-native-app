// app/api/users/route.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// // GET /api/users
// export async function GET() {
//   // ตัวอย่าง: ดึงข้อมูลจาก Prisma
//   // const users = await prisma.user.findMany()
//   return NextResponse.json({
//     users: [
//       { id: 1, name: "John", email: "john@example.com" },
//       { id: 2, name: "Jane", email: "jane@example.com" },
//     ],
//   });
// }

// ตัวอย่างการอ่าน Query Parameters
// GET /api/users?page=1&limit=10
export async function GET(request: NextRequest) {
  // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  return NextResponse.json({
    page: parseInt(page),
    limit: parseInt(limit),
    data: [],
  });
}

// POST /api/users
export async function POST(request: NextRequest) {
  // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 },
    );
  }

  // ตัวอย่าง: สร้าง user ใน Prisma
  // const user = await prisma.user.create({ data: { name, email } })
  return NextResponse.json(
    { message: "User created", user: { name, email } },
    { status: 201 },
  );
}
