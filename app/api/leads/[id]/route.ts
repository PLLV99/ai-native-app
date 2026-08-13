import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update Lead status (PATCH /api/leads/:id)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ["new", "contacted", "qualified", "converted"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status — must be: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("Lead PATCH Error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}

// Fetch a single Lead (GET /api/leads/:id)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("Lead GET Error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
