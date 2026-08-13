import { NextRequest, NextResponse } from "next/server";
import { createContactSchema, validationError } from "@/lib/validations";
import { rateLimitIp } from "@/lib/rate-limit";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit — this endpoint is public and every accepted submission
    //    fires an n8n workflow, so unlimited calls means unlimited spam.
    const limited = await rateLimitIp(request, "contact", 5, 600);
    if (limited) return limited;

    // 2. Validate the payload before it reaches any downstream service
    const parsed = createContactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }
    const { name, phone, service, message } = parsed.data;

    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL is not set");
      return NextResponse.json(
        { error: "Contact service is not configured" },
        { status: 503 },
      );
    }

    // 3. Forward the submission to the n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        service,
        message,
        timestamp: new Date().toISOString(),
        source: "website",
      }),
    });

    if (!n8nResponse.ok) {
      console.error("n8n webhook error:", await n8nResponse.text());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
