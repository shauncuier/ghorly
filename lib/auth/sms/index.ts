import "server-only";

import { createBulkSmsBd } from "@/lib/auth/sms/bulksmsbd";
import type { SmsProvider } from "@/lib/auth/sms/types";

/**
 * Picks the SMS gateway from the environment.
 *
 * Returns `null` when nothing is configured, which is what puts the OTP flow
 * into its development mode (code logged and returned to the form instead of
 * texted). That is a deliberate affordance for building and demoing — and a
 * hole if it ever reaches real users, so `assertSmsConfigured()` is called on
 * the request path in production.
 *
 * The environment is read lazily rather than at module scope, for two reasons:
 *
 *  1. `next build` runs with NODE_ENV=production and evaluates this module
 *     while collecting page data. A module-level throw would make the build
 *     itself require SMS credentials — but these are *runtime* secrets, and a
 *     build machine has no business holding them.
 *  2. Containers commonly inject env at start, not at image build. A value
 *     captured at module scope can be stale or empty in that setup.
 */

function readEnv() {
  const apiKey = process.env.BULKSMSBD_API_KEY;
  const senderId = process.env.BULKSMSBD_SENDER_ID;
  return { apiKey, senderId, configured: Boolean(apiKey && senderId) };
}

let cached: SmsProvider | null | undefined;

export function getSmsProvider(): SmsProvider | null {
  if (cached !== undefined) return cached;
  const { apiKey, senderId, configured } = readEnv();
  cached = configured ? createBulkSmsBd(apiKey!, senderId!) : null;
  return cached;
}

export function isSmsConfigured(): boolean {
  return readEnv().configured;
}

/**
 * Without a gateway the login endpoint returns the OTP in its own response —
 * which means anyone can sign in as anyone. Fine for development, fatal in
 * production, so the OTP path refuses to run rather than serving an open door.
 *
 * Throws on the request path, not at module load: a misconfigured deployment
 * fails every login attempt loudly instead of failing the build of a machine
 * that never needed the credentials.
 */
export function assertSmsConfigured(): void {
  if (isSmsConfigured()) return;
  if (process.env.NODE_ENV !== "production") return;
  throw new Error(
    "BULKSMSBD_API_KEY and BULKSMSBD_SENDER_ID are required in production. " +
      "Without an SMS gateway the OTP is returned to the caller, so anyone " +
      "could sign in as anyone.",
  );
}

export { otpMessage, smsSegments } from "@/lib/auth/sms/message";

export type { SmsProvider, SmsResult } from "@/lib/auth/sms/types";
