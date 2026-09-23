import type { SmsProvider, SmsResult } from "@/lib/auth/sms/types";

/**
 * BulkSMSBD gateway (bulksmsbd.net).
 *
 * Their API answers HTTP 200 for *everything* — success and failure alike —
 * and puts the real outcome in a `response_code` field. So the status code is
 * meaningless here and the body has to be parsed and mapped. That is what most
 * of this file is.
 *
 * This module reads no environment itself — credentials are passed in by
 * `lib/auth/sms/index.ts`, which carries the `server-only` guard. Keeping the
 * factory pure is what lets the check script exercise the real gateway code.
 *
 * Credentials are never logged: `api_key` goes
 * in the POST body rather than the query string, so it cannot leak through
 * access logs, proxies or Referer headers the way a GET would.
 */

/** Shown whenever the real reason is ours, not the user's. */
const GENERIC_FAILURE = "কোড পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।";

const ENDPOINT = "https://bulksmsbd.net/api/smsapi";
const BALANCE_ENDPOINT = "https://bulksmsbd.net/api/getBalanceApi";

/**
 * BulkSMSBD's documented response codes.
 *
 * `202` is the only success. The rest are mapped to something a Bangladeshi
 * operator would actually understand, and flagged retryable only where a retry
 * could plausibly succeed — resending on "insufficient balance" just burns
 * requests.
 *
 * These strings are for LOGS, not for users. Only `1001` (bad number) is
 * something the person signing in can fix; everything else is our
 * misconfiguration, and telling a stranger at a login form that the account is
 * deactivated or the balance expired leaks operational state to no benefit.
 * `actionable` marks the exceptions.
 */
const CODES: Record<string, { message: string; retryable: boolean; actionable?: boolean }> = {
  "202": { message: "পাঠানো হয়েছে।", retryable: false },
  "1001": { message: "নম্বরটি সঠিক নয়।", retryable: false, actionable: true },
  "1002": { message: "সেন্ডার আইডি সঠিক নয় বা নিষ্ক্রিয়।", retryable: false },
  "1003": { message: "সব তথ্য দেওয়া হয়নি।", retryable: false },
  "1005": { message: "গেটওয়েতে সমস্যা হয়েছে।", retryable: true },
  "1006": { message: "ব্যালেন্সের মেয়াদ শেষ।", retryable: false },
  "1007": { message: "ব্যালেন্স শেষ হয়ে গেছে।", retryable: false },
  "1011": { message: "ব্যবহারকারী আইডি পাওয়া যায়নি।", retryable: false },
  // Masking sender IDs may only carry Bengali text. Our OTP template is the
  // English one BulkSMSBD mandates, so seeing this code means the sender ID is
  // a masking one and is incompatible with that template — switch the sender ID
  // to a non-masking / OTP route rather than rewording the message.
  "1012": { message: "মাস্কিং এসএমএস বাংলায় পাঠাতে হবে।", retryable: false },
  "1013": { message: "এই API key-এর জন্য গেটওয়ে নেই।", retryable: false },
  "1014": { message: "সেন্ডার টাইপ পাওয়া যায়নি।", retryable: false },
  "1015": { message: "বৈধ গেটওয়ে পাওয়া যায়নি।", retryable: false },
  "1016": { message: "সেন্ডারের মূল্য তথ্য পাওয়া যায়নি।", retryable: false },
  "1017": { message: "সেন্ডারের মূল্য তথ্য নেই।", retryable: false },
  "1018": { message: "অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।", retryable: false },
  "1019": { message: "সেন্ডার টাইপের মূল্য নিষ্ক্রিয়।", retryable: false },
  "1020": { message: "প্যারেন্ট অ্যাকাউন্ট পাওয়া যায়নি।", retryable: false },
  "1021": { message: "প্যারেন্ট সেন্ডার মূল্য পাওয়া যায়নি।", retryable: false },
};

export function createBulkSmsBd(apiKey: string, senderId: string): SmsProvider {
  return {
    name: "bulksmsbd",

    async send(to: string, text: string): Promise<SmsResult> {
      // BulkSMSBD expects the number with the 88 country prefix.
      const number = to.startsWith("88") ? to : `88${to}`;

      let response: Response;
      try {
        response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          // POST, not GET: a query-string api_key ends up in access logs.
          body: new URLSearchParams({
            api_key: apiKey,
            senderid: senderId,
            number,
            message: text,
          }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch (error) {
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        return {
          ok: false,
          code: timedOut ? "timeout" : "network",
          message: "এসএমএস গেটওয়েতে পৌঁছানো যায়নি।",
          userMessage: GENERIC_FAILURE,
          retryable: true,
        };
      }

      const raw = await response.text();

      // The gateway returns 200 even for failures, so the body is the source
      // of truth. It is usually JSON but has been seen as bare text.
      let code: string | undefined;
      let reference: string | undefined;
      try {
        const parsed = JSON.parse(raw) as {
          response_code?: number | string;
          success_message?: string;
          error_message?: string;
        };
        code = parsed.response_code !== undefined ? String(parsed.response_code) : undefined;
        reference = parsed.success_message ?? parsed.error_message;
      } catch {
        const match = raw.match(/\b(\d{3,4})\b/);
        code = match?.[1];
      }

      if (code === "202") {
        return { ok: true, code, reference, message: CODES["202"].message };
      }

      const known = code ? CODES[code] : undefined;
      return {
        ok: false,
        code: code ?? "unknown",
        message: known?.message ?? "এসএমএস পাঠানো যায়নি।",
        userMessage: known?.actionable ? known.message : GENERIC_FAILURE,
        retryable: known?.retryable ?? false,
      };
    },

    async balance(): Promise<number | null> {
      try {
        const res = await fetch(BALANCE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ api_key: apiKey }),
          signal: AbortSignal.timeout(10_000),
        });
        const parsed = (await res.json()) as { balance?: number | string };
        const value = Number(parsed?.balance);
        return Number.isFinite(value) ? value : null;
      } catch {
        return null;
      }
    },
  };
}
