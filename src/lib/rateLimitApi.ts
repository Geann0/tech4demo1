// src/lib/rateLimitApi.ts
// API route wrapper for rate limiting

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "./rateLimitNew";

/**
 * Get client identifier (IP address)
 */
function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.ip || "unknown";
  return ip;
}

/**
 * Middleware for rate limiting API endpoints
 *
 * Usage in API route:
 * export async function POST(req: NextRequest) {
 *   const rateLimited = await withRateLimit(req, 'login');
 *   if (rateLimited) return rateLimited;
 *
 *   // Your handler logic
 * }
 */
export async function withRateLimit(
  req: NextRequest,
  configName: "login" | "signup" | "checkout" | "api" | "search" = "api"
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(req);
  const { allowed, remaining, retryAfter } = checkRateLimit(
    identifier,
    configName
  );

  // Add rate limit headers to response
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", "5"); // Example
  headers.set("X-RateLimit-Remaining", remaining.toString());

  if (!allowed && retryAfter) {
    headers.set("Retry-After", retryAfter.toString());
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        retryAfter,
      }),
      {
        status: 429,
        headers,
      }
    );
  }

  return null; // Allow request to proceed
}

/**
 * Create a rate-limited API handler
 *
 * Usage:
 * export const POST = createRateLimitedHandler('login', async (req) => {
 *   // Your handler logic
 * });
 */
export function createRateLimitedHandler(
  configName: "login" | "signup" | "checkout" | "api" | "search",
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const rateLimited = await withRateLimit(req, configName);
    if (rateLimited) return rateLimited;

    return handler(req);
  };
}
