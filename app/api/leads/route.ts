import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushMessageToGroup } from "@/lib/line-push";
import { createLeadSchema, validationError } from "@/lib/validations";
import { rateLimitIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit — public endpoint that writes to the database and pushes a
    // LINE message on every accepted submission.
    const limited = await rateLimitIp(request, "leads", 5, 600);
    if (limited) return limited;

    // Validate: the old check only asked "is there a value?", so an object or
    // a 10 MB string passed straight through to Prisma.
    const parsed = createLeadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }
    const { name, email, phone, company, interest } = parsed.data;

    // 1. Save Lead to PostgreSQL via Prisma
    await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        interest: interest || null,
        source: "website",
      },
    });

    // 2. Send notification to LINE Group via LINE Messaging API
    await pushMessageToGroup(
      `🔔 New Lead from Website!\n` +
        `👤 Name: ${name}\n` +
        `📧 Email: ${email}\n` +
        `📱 Phone: ${phone || "-"}\n` +
        `🏢 Company: ${company || "-"}\n` +
        `💡 Interest: ${interest || "-"}\n` +
        `🕐 Time: ${new Date().toLocaleString("en-US")}`,
    );

    // 3. Send Lead to n8n Webhook (if configured)
    // const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    // if (n8nWebhookUrl) {
    //   await fetch(n8nWebhookUrl, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       ...lead,
    //       timestamp: lead.createdAt.toISOString(),
    //     }),
    //   })
    // }

    return NextResponse.json({
      message:
        "Thank you for your interest! Our team will contact you within 24 hours.",
      success: true,
    });
  } catch (error: any) {
    console.error("Lead API Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}

// Fetch all Leads (For Admin)
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error: any) {
    console.error("Lead GET Error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
