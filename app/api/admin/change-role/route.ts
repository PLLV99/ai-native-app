import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { changeRoleSchema, validationError } from "@/lib/validations";

export async function POST(request: NextRequest) {
  // 1. ตรวจสอบว่าผู้ใช้ล็อกอินอยู่
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //2.ตรวจสอบว่าเป็น Admin (รองรับ multi-role เช่น "admin,manager")
  const userRoles = (session.user.role ?? "user")
    .split(",")
    .map((r: string) => r.trim());

  if (!userRoles.includes("admin")) {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 },
    );
  }

  // 3. อ่านและ validate request body (z.enum เช็ค role ให้เอง ไม่ต้องเขียน validRoles)
  const parsed = changeRoleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const { userId, newRole } = parsed.data;

  // 4. กันยิงตีนตัวเอง — ถ้า admin คนสุดท้ายลดสิทธิ์ตัวเอง จะไม่มีใครเข้า
  //    /admin/users ได้อีกเลย และคนที่จะแต่งตั้ง admin ใหม่ก็ต้องเป็น admin
  //    ทางออกเหลือแค่แก้ database ตรง ๆ ซึ่งบน production อาจไม่มีสิทธิ์
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role. Ask another admin to do it." },
      { status: 400 },
    );
  }

  if (newRole !== "admin") {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const targetIsAdmin = (target?.role ?? "")
      .split(",")
      .map((r) => r.trim())
      .includes("admin");

    if (targetIsAdmin) {
      // role เก็บเป็น string เดียวคั่นด้วย comma เลยต้องนับด้วย contains
      const adminCount = await prisma.user.count({
        where: { role: { contains: "admin" } },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "The system must keep at least one admin." },
          { status: 400 },
        );
      }
    }
  }

  // 5. อัปเดต role ใน database
  try {
    const updateUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return NextResponse.json({
      message: `Role updated to ${newRole}`,
      user: {
        id: updateUser.id,
        name: updateUser.name,
        email: updateUser.email,
        role: updateUser.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "User not found or update failed" },
      { status: 404 },
    );
  }
}
