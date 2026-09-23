import "server-only";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db/client";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_SECONDS,
  type OtpChallenge,
} from "@/lib/auth/types";
import {
  assertSmsConfigured,
  getSmsProvider,
  isSmsConfigured,
  otpMessage,
} from "@/lib/auth/sms";

/**
 * Phone + one-time code.
 *
 * Codes are never stored in plaintext — a database dump should not hand
 * somebody a set of working login codes. Each challenge gets its own salt, the
 * comparison is constant-time, and a code is single-use.
 */

const COLLECTION = "otpChallenges";

export { isSmsConfigured };

/** Bangladeshi mobile numbers: 11 digits, `01[3-9]` prefix. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("880") ? digits.slice(3) : digits;
  const withZero = local.startsWith("0") ? local : `0${local}`;
  return /^01[3-9]\d{8}$/.test(withZero) ? withZero : null;
}

function hashCode(code: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

function generateCode(): string {
  // randomInt is CSPRNG-backed; Math.random would be guessable.
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export interface RequestOtpResult {
  ok: boolean;
  /** Only populated when no SMS provider is configured (dev / demo). */
  devCode?: string;
  retryAfterSeconds?: number;
  error?: string;
}

/**
 * Issues a code for a phone number.
 *
 * Deliberately does **not** reveal whether the number belongs to a known
 * account — that would turn this endpoint into a user-enumeration oracle.
 */
export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  // Checked here, not only at the route, so no caller can bypass it: in
  // production an unconfigured gateway must fail the request rather than
  // fall through to the devCode branch at the bottom of this function.
  assertSmsConfigured();

  const db = await getDb();
  if (!db) return { ok: false, error: "ডেটাবেস পাওয়া যায়নি।" };

  const now = new Date();

  // One live code per number, and a floor between resends.
  const existing = (await db
    .collection(COLLECTION)
    .findOne({ phone, consumedAt: null, expiresAt: { $gt: now } } as never)) as OtpChallenge | null;

  if (existing) {
    const age = (now.getTime() - new Date(existing.createdAt).getTime()) / 1000;
    if (age < 60) {
      return { ok: false, retryAfterSeconds: Math.ceil(60 - age) };
    }
    await db.collection(COLLECTION).deleteMany({ phone, consumedAt: null } as never);
  }

  const code = generateCode();
  const salt = randomBytes(16).toString("hex");

  await db.collection(COLLECTION).insertOne({
    _id: `otp-${randomBytes(8).toString("hex")}`,
    phone,
    codeHash: hashCode(code, salt),
    salt,
    expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
    attempts: 0,
    consumedAt: null,
    createdAt: now,
  } as never);

  const provider = getSmsProvider();

  if (provider) {
    const sent = await provider.send(phone, otpMessage(code));

    if (!sent.ok) {
      // The challenge is useless if the code never arrived — drop it so the
      // user can immediately request another instead of waiting out the
      // 60-second resend floor on a code they never received.
      await db.collection(COLLECTION).deleteOne({ phone, consumedAt: null } as never);

      // Log the gateway's code for support; show the user something useful.
      console.error(`[sms:${provider.name}] send failed`, {
        code: sent.code,
        retryable: sent.retryable,
      });
      // `userMessage`, not `message`: the latter names our own configuration
      // faults and must not reach a login form.
      return { ok: false, error: sent.userMessage ?? "কোড পাঠানো যায়নি।" };
    }

    // Never log the code itself once it is real — a log file should not be a
    // set of working login credentials.
    console.info(`[sms:${provider.name}] otp sent`, { reference: sent.reference });
    return { ok: true };
  }

  // No gateway configured: log it server-side and hand it back so the flow is
  // testable in development. `assertSmsConfigured()` blocks this in production.
  console.info(`[otp] ${phone} → ${code} (no SMS gateway configured)`);
  return { ok: true, devCode: code };
}

export interface VerifyOtpResult {
  ok: boolean;
  error?: string;
  attemptsLeft?: number;
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const db = await getDb();
  if (!db) return { ok: false, error: "ডেটাবেস পাওয়া যায়নি।" };

  const now = new Date();
  const challenge = (await db
    .collection(COLLECTION)
    .findOne({ phone, consumedAt: null, expiresAt: { $gt: now } } as never)) as OtpChallenge | null;

  if (!challenge) {
    return { ok: false, error: "কোডের মেয়াদ শেষ। নতুন কোড নিন।" };
  }

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await db.collection(COLLECTION).deleteOne({ _id: challenge._id } as never);
    return { ok: false, error: "অনেকবার ভুল হয়েছে। নতুন কোড নিন।" };
  }

  const supplied = Buffer.from(hashCode(code, challenge.salt), "hex");
  const stored = Buffer.from(challenge.codeHash, "hex");
  const matches =
    supplied.length === stored.length && timingSafeEqual(supplied, stored);

  if (!matches) {
    await db
      .collection(COLLECTION)
      .updateOne({ _id: challenge._id } as never, { $inc: { attempts: 1 } });
    const left = OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
    return {
      ok: false,
      error: "কোডটি সঠিক নয়।",
      attemptsLeft: Math.max(0, left),
    };
  }

  // Single use: burn it immediately so a replayed code cannot sign in twice.
  await db
    .collection(COLLECTION)
    .updateOne({ _id: challenge._id } as never, { $set: { consumedAt: now } });

  return { ok: true };
}

/** TTL index so expired challenges clean themselves up. */
export async function ensureOtpIndexes(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.collection(COLLECTION).createIndex({ phone: 1, consumedAt: 1 });
  await db.collection(COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}
