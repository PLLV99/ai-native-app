import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Fixed-window rate limiter backed by PostgreSQL.
 *
 * The counter lives in the database rather than in memory so the limit still
 * holds when the app runs as multiple containers or on serverless, where every
 * request may hit a fresh instance.
 *
 * The increment and the window reset happen in a single statement so two
 * concurrent requests cannot both read a stale count and each write back 1.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "rate_limit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "rate_limit"."resetAt" <= ${now} THEN 1 ELSE "rate_limit"."count" + 1 END,
      "resetAt" = CASE WHEN "rate_limit"."resetAt" <= ${now} THEN ${resetAt} ELSE "rate_limit"."resetAt" END
    RETURNING "count", "resetAt"
  `;

  const row = rows[0] ?? { count: 1, resetAt };

  return {
    ok: row.count <= limit,
    limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.resetAt,
  };
}

/**
 * Best-effort client identity for unauthenticated endpoints.
 *
 * IP is spoofable and shared behind NAT, so prefer the user id whenever the
 * caller is logged in — see rateLimitUser below.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** 429 response carrying the standard rate-limit headers. */
export function tooManyRequests(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  );

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    },
  );
}

/**
 * Guard a public endpoint by IP. Returns a 429 response to return early,
 * or null when the request is allowed through.
 *
 * A database outage must not take the whole endpoint down, so a failed check
 * lets the request pass — availability over strictness for a soft limit.
 */
export async function rateLimitIp(
  request: NextRequest,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  try {
    const result = await checkRateLimit(
      `${scope}:${getClientIp(request)}`,
      limit,
      windowSeconds,
    );
    return result.ok ? null : tooManyRequests(result);
  } catch (error) {
    console.error("Rate limit check failed, allowing request:", error);
    return null;
  }
}

/**
 * Guard an endpoint by user id. Preferred over IP for anything that costs
 * money per call, because a user id cannot be swapped by changing networks.
 */
export async function rateLimitUser(
  userId: string,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  try {
    const result = await checkRateLimit(
      `${scope}:${userId}`,
      limit,
      windowSeconds,
    );
    return result.ok ? null : tooManyRequests(result);
  } catch (error) {
    console.error("Rate limit check failed, allowing request:", error);
    return null;
  }
}
