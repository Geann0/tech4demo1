// src/lib/__tests__/rateLimit.test.ts
// Unit tests for rate limiting functionality

import {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
} from "../rateLimitNew";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    resetRateLimit("login:test-user");
    resetRateLimit("signup:test-user");
    resetRateLimit("api:test-user");
  });

  describe("Login Rate Limit (5 attempts / 5 min)", () => {
    it("should allow first login attempt", () => {
      const result = checkRateLimit("test-user", "login");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should allow 5 login attempts", () => {
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit("test-user", "login");
        expect(result.allowed).toBe(true);
      }
    });

    it("should block 6th login attempt", () => {
      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-user", "login");
      }

      // 6th attempt should be blocked
      const result = checkRateLimit("test-user", "login");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should return correct remaining count", () => {
      const result1 = checkRateLimit("test-user", "login");
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit("test-user", "login");
      expect(result2.remaining).toBe(3);

      const result3 = checkRateLimit("test-user", "login");
      expect(result3.remaining).toBe(2);
    });

    it("should isolate rate limits by user", () => {
      checkRateLimit("user1", "login");
      checkRateLimit("user1", "login");

      const result = checkRateLimit("user2", "login");
      expect(result.remaining).toBe(4); // Not affected by user1
    });
  });

  describe("Signup Rate Limit (3 attempts / 1 hour)", () => {
    it("should allow first signup", () => {
      const result = checkRateLimit("test-user", "signup");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("should block after 3 signups", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test-user", "signup");
      }

      const result = checkRateLimit("test-user", "signup");
      expect(result.allowed).toBe(false);
    });
  });

  describe("API Rate Limit (100 requests / 1 min)", () => {
    it("should allow general API requests", () => {
      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit(`test-user-${i}`, "api");
        expect(result.allowed).toBe(true);
      }
    });

    it("should block after 100 requests", () => {
      for (let i = 0; i < 100; i++) {
        checkRateLimit("test-user", "api");
      }

      const result = checkRateLimit("test-user", "api");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Checkout Rate Limit (5 attempts / 1 min)", () => {
    it("should protect checkout endpoint", () => {
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit("test-user", "checkout");
        expect(result.allowed).toBe(true);
      }

      const result = checkRateLimit("test-user", "checkout");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Reset Rate Limit", () => {
    it("should reset rate limit for a key", () => {
      checkRateLimit("test-user", "login");
      checkRateLimit("test-user", "login");

      // Reset
      resetRateLimit("login:test-user");

      // Should be allowed again
      const result = checkRateLimit("test-user", "login");
      expect(result.remaining).toBe(4);
    });
  });

  describe("Rate Limit Status", () => {
    it("should return current status", () => {
      checkRateLimit("test-user", "login");
      checkRateLimit("test-user", "login");

      const status = getRateLimitStatus("login:test-user");
      expect(Array.isArray(status)).toBe(true);
      expect(status.length).toBe(2);
    });
  });

  describe("Different config types", () => {
    it("should use correct config for each type", () => {
      const loginResult = checkRateLimit("user1", "login");
      const signupResult = checkRateLimit("user2", "signup");
      const apiResult = checkRateLimit("user3", "api");

      // Check that each has appropriate max values
      expect(loginResult.allowed).toBe(true);
      expect(signupResult.allowed).toBe(true);
      expect(apiResult.allowed).toBe(true);

      // Verify that limits are set correctly
      expect(loginResult.remaining).toBeGreaterThanOrEqual(0);
      expect(loginResult.remaining).toBeLessThanOrEqual(4);
    });
  });

  describe("Retry-After header", () => {
    it("should provide retry-after time when rate limited", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-user", "login");
      }

      const result = checkRateLimit("test-user", "login");
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(300); // 5 minutes in seconds
    });
  });
});
