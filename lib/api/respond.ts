import "server-only";

import { NextResponse } from "next/server";

/**
 * Consistent API responses, and one place that decides what an error is
 * allowed to say.
 *
 * Error bodies carry a stable machine code and a Bangla message safe to show a
 * user. Internal detail — stack traces, driver errors, which record existed —
 * stays server-side: "not found" and "not yours" deliberately look identical
 * from outside, so the API cannot be used to probe for record ids.
 */

export type ErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "invalid"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unavailable"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  invalid: 400,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  unavailable: 503,
  internal: 500,
};

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function ok<T extends object>(body: T, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { headers: { ...NO_STORE, ...headers } });
}

export function fail(
  code: ErrorCode,
  message: string,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(
    { error: { code, message } },
    { status: STATUS[code], headers: { ...NO_STORE, ...headers } },
  );
}

export function rateLimited(retryAfterSeconds: number) {
  return fail("rate_limited", "অনেক বেশি চেষ্টা হয়েছে। একটু পরে আবার চেষ্টা করুন।", {
    "Retry-After": String(retryAfterSeconds),
  });
}

/**
 * Logs the real error server-side and returns a generic one.
 * Never let a driver message or stack trace reach the client.
 */
export function internal(scope: string, error: unknown) {
  console.error(`[api:${scope}]`, error);
  return fail("internal", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
}
