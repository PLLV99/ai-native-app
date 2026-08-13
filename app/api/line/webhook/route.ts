import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateRAGResponse } from "@/lib/rag-service";
import { prisma } from "@/lib/prisma";

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

// Keywords to trigger the Bot in a Group
const TRIGGER_KEYWORDS = ["/bot", "!ask", "/ask", "@bot"];

// Verify Signature from LINE
function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("SHA256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// Send a plain text reply to LINE (Used for fallback/errors)
async function replyMessage(replyToken: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "text",
          text,
        },
      ],
    }),
  });
}

// Fetch group name from LINE API
async function getGroupName(groupId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/group/${groupId}/summary`,
      {
        headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
      },
    );
    if (res.ok) {
      const data = await res.json();
      return data.groupName || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Auto-register Group ID to the Database when the Bot is invited to a group
async function registerGroup(groupId: string) {
  const groupName = await getGroupName(groupId);
  await prisma.lineGroup.upsert({
    where: { groupId },
    update: { active: true, groupName },
    create: { groupId, groupName, active: true },
  });
  console.log(`✅ LINE group saved: ${groupName || groupId}`);
}

// Disable group notifications when the Bot is kicked out
async function unregisterGroup(groupId: string) {
  await prisma.lineGroup
    .update({
      where: { groupId },
      data: { active: false },
    })
    .catch(() => {}); // Skip if no record exists yet
  console.log(`🚫 Bot left group: ${groupId}`);
}

// Send a Flex Message reply to LINE (Main RAG Response format)
async function replyFlexMessage(
  replyToken: string,
  answer: string,
  sources: Array<{ source: string; similarity: number }>,
) {
  const flexMessage = {
    type: "flex",
    altText: answer.substring(0, 100),
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🤖 AI Assistant",
            weight: "bold",
            size: "lg",
            color: "#1a56db",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: answer,
            wrap: true,
            size: "sm",
          },
          ...(sources.length > 0
            ? [
                {
                  type: "separator" as const,
                  margin: "md",
                },
                {
                  type: "text" as const,
                  text: "📎 References",
                  size: "xs" as const,
                  color: "#999999",
                  margin: "md",
                },
                ...sources.slice(0, 2).map((s) => ({
                  type: "text" as const,
                  text: `• ${s.source} (${Math.round(s.similarity * 100)}%)`,
                  size: "xs" as const,
                  color: "#999999",
                })),
              ]
            : []),
        ],
      },
    },
  };

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [flexMessage],
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature") || "";

    // 1. Verify Signature
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);

    // 2. Loop through and process Events
    for (const event of data.events) {
      // ===== Handle Event: Bot joins a group =====
      if (event.type === "join" && event.source?.groupId) {
        // Bot was invited → Auto-save Group ID to DB
        await registerGroup(event.source.groupId);
        await replyMessage(
          event.replyToken,
          "Hello! 🤖 I'm ready to answer your questions.\n\nType @bot followed by your question, for example:\n@bot What products are available?",
        );
        continue;
      }

      // ===== Handle Event: Bot leaves a group =====
      if (event.type === "leave" && event.source?.groupId) {
        // Bot was kicked out → Disable notifications
        await unregisterGroup(event.source.groupId);
        continue;
      }

      // ===== Handle Event: Message =====
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;
        const isGroup =
          event.source.type === "group" || event.source.type === "room";

        // Auto-register: If a message comes from an unregistered group → Register it now
        if (isGroup && event.source.groupId) {
          registerGroup(event.source.groupId).catch(() => {});
        }

        // In Group: Reply only when a trigger keyword is used
        if (isGroup) {
          const hasTrigger = TRIGGER_KEYWORDS.some((keyword) =>
            userMessage.toLowerCase().startsWith(keyword.toLowerCase()),
          );

          if (!hasTrigger) continue; // Skip this message

          // Remove the keyword from the message
          let cleanMessage = userMessage;
          for (const keyword of TRIGGER_KEYWORDS) {
            cleanMessage = cleanMessage
              .replace(new RegExp(`^${keyword}\\s*`, "i"), "")
              .trim();
          }

          // Generate answer using RAG
          try {
            const response = await generateRAGResponse(cleanMessage, [], 3);
            const sources = response.sources.map((s) => ({
              source: s.metadata?.source || "N/A",
              similarity: s.similarity ?? 0,
            }));
            await replyFlexMessage(replyToken, response.answer, sources);
          } catch (error) {
            await replyMessage(
              replyToken,
              "Sorry, the system is experiencing temporary issues. Please try again.",
            );
          }
        } else {
          // 1:1 Chat: Reply to every message
          try {
            const response = await generateRAGResponse(userMessage, [], 3);
            const sources = response.sources.map((s) => ({
              source: s.metadata?.source || "N/A",
              similarity: s.similarity ?? 0,
            }));
            await replyFlexMessage(replyToken, response.answer, sources);
          } catch (error) {
            await replyMessage(
              replyToken,
              "Sorry, the system is experiencing temporary issues. Please try again.",
            );
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("LINE Webhook Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
