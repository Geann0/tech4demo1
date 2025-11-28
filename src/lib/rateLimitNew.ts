// src/lib/rateLimit.ts
// Rate limiting implementation for protecting API endpoints

import { cache } from "react";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitStore {
  [key: string]: Array<{
    timestamp: number;
  }>;
}

// In-memory store (use Redis in production)
const rateLimitStore: RateLimitStore = {};

// Configuration for different endpoints
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 attempts max
  },
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 signups per hour
  },
  checkout: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 checkout attempts per minute
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute (generous for general API)
  },
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },
};

/**
 * Check if a request exceeds the rate limit
 *
 * @param identifier - Unique identifier (IP, user ID, etc)
 * @param configName - Name of the rate limit config to use
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  configName: keyof typeof rateLimitConfigs = "api"
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const config = rateLimitConfigs[configName];
  const now = Date.now();
  const key = `${configName}:${identifier}`;

  // Initialize if not exists
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = [];
  }

  const requests = rateLimitStore[key];

  // Remove old requests outside the window
  const windowStart = now - config.windowMs;
  rateLimitStore[key] = requests.filter((req) => req.timestamp > windowStart);

  const requestCount = rateLimitStore[key].length;
  const allowed = requestCount < config.maxRequests;

  // Calculate remaining BEFORE adding current request
  const remaining = Math.max(
    0,
    config.maxRequests - requestCount - (allowed ? 1 : 0)
  );

  // Add current request if allowed
  if (allowed) {
    rateLimitStore[key].push({ timestamp: now });
  }

  const resetTime =
    rateLimitStore[key].length > 0
      ? Math.min(...rateLimitStore[key].map((r) => r.timestamp)) +
        config.windowMs
      : now + config.windowMs;

  return {
    allowed,
    remaining,
    resetTime,
    retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
  };
}

/**
 * Clean up old entries from the rate limit store
 * Call periodically (e.g., every 5 minutes)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();

  Object.keys(rateLimitStore).forEach((key) => {
    const requests = rateLimitStore[key];
    const maxWindowMs = Math.max(
      ...Object.values(rateLimitConfigs).map((c) => c.windowMs)
    );

    rateLimitStore[key] = requests.filter(
      (req) => now - req.timestamp < maxWindowMs
    );

    // Remove empty entries
    if (rateLimitStore[key].length === 0) {
      delete rateLimitStore[key];
    }
  });
}

/**
 * Get rate limit status for monitoring
 */
export function getRateLimitStatus(key?: string) {
  if (key) {
    return rateLimitStore[key] || [];
  }
  return rateLimitStore;
}

/**
 * Reset rate limit for a specific key (admin only)
 */
export function resetRateLimit(key: string): boolean {
  if (rateLimitStore[key]) {
    delete rateLimitStore[key];
    return true;
  }
  return false;
}

// Clean up every 5 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
