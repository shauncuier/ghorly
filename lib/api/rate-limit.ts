import "server-only";

/**
 * Fixed-window rate limiting, in process memory.
 *
 * Honest about its limits: this counts per Node process, so behind more than
 * one instance each gets its own budget. That is fine for a single deployment
 * and worth nothing behind a load balancer — move the counters to Redis (or
 * Upstash, or the platform's own limiter) before scaling out. It is here
 * because an unthrottled OTP endpoint is an SMS bill and a brute-force oracle.
 */

interface Window {
  count: number;
  resetAt: number;
}

declare global {
  var __ghorlyRateLimit: Map<string, Window> | undefined;
}

const buckets = (globalThis.__ghorlyRateLimit ??= new Map<string, Window>());

/** Evict expired windows occasionally so the map cannot grow without bound. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/**
 * Best-effort client identity for limiting.
 *
 * `x-forwarded-for` is trivially spoofable unless a trusted proxy sets it, so
 * this is a speed bump rather than a control. Pair it with the platform's own
 * edge limiter in production.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || real || "unknown";
  return ip;
}

export const LIMITS = {
  /** OTP requests cost real money — keep this tight. */
  otpRequest: { limit: 5, window: 15 * 60 },
  otpVerify: { limit: 10, window: 15 * 60 },
  mutate: { limit: 120, window: 60 },
  read: { limit: 300, window: 60 },
} as const;
