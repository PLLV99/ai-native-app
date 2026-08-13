// lib/line-push.ts
// Send Push Message to LINE groups via LINE Messaging API
// Supports multiple groups simultaneously — fetches Group IDs from Database (auto-register)
// Fallback to use ENV if DB has no data yet

import { prisma } from "@/lib/prisma";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

/**
 * Fetch all active Group IDs from the Database (line_group table)
 * If DB has no data yet → fallback to reading from ENV (LINE_GROUP_IDS / LINE_GROUP_ID)
 */
async function getGroupIds(): Promise<string[]> {
  try {
    // 1. Fetch from Database first (active groups)
    const groups = await prisma.lineGroup.findMany({
      where: { active: true },
      select: { groupId: true },
    });

    if (groups.length > 0) {
      return groups.map((g) => g.groupId);
    }
  } catch (error) {
    console.warn("⚠️ Cannot fetch Group IDs from DB:", error);
  }

  // 2. Fallback: Read from ENV
  const ids = process.env.LINE_GROUP_IDS || process.env.LINE_GROUP_ID || "";
  return ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Send Push Message to a single target (userId / groupId)
 */
async function pushMessage(to: string, text: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`❌ LINE Push Message Error (${to}):`, res.status, error);
    throw new Error(`LINE Push Message failed: ${res.status} → ${to}`);
  }

  console.log("✅ LINE Push Message sent successfully →", to);
}

/**
 * Send Push Message (text) to all active LINE groups in the DB
 * - Sends to all groups simultaneously using Promise.allSettled
 * - Push Messages consume quota according to your LINE OA plan
 */
export async function pushMessageToGroup(text: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn(
      "⚠️ LINE_CHANNEL_ACCESS_TOKEN is not set — skipping notification",
    );
    return;
  }

  const groupIds = await getGroupIds();
  if (groupIds.length === 0) {
    console.warn("⚠️ No active LINE groups found — skipping notification");
    return;
  }

  const results = await Promise.allSettled(
    groupIds.map((groupId) => pushMessage(groupId, text)),
  );

  const success = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  if (failed > 0) {
    console.warn(
      `⚠️ LINE Push: Success ${success}/${groupIds.length} groups (Failed ${failed})`,
    );
  } else {
    console.log(`✅ LINE Push: Successfully sent to all ${success} groups`);
  }
}

export async function pushMessageTo(to: string, text: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("⚠️ LINE_CHANNEL_ACCESS_TOKEN is not set");
    return;
  }
  await pushMessage(to, text);
}
