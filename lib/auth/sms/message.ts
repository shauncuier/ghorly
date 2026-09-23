/**
 * OTP message text and cost estimation. Pure — no environment, no network —
 * so scripts and tests can import it without tripping the `server-only` guard
 * that `lib/auth/sms/index.ts` carries.
 */

/** Shown in the SMS. Latin on purpose — see the note on `otpMessage`. */
export const SMS_BRAND = "Ghorly";

/**
 * BulkSMSBD mandates this exact wording for OTP traffic:
 *
 *     Your {Brand/Company Name} OTP is XXXX
 *
 * So the text is English even though every other surface in the product is
 * Bangla. This is a gateway/operator requirement, not a product decision —
 * do not "fix" it to match the UI.
 *
 * TWO CONSEQUENCES WORTH KNOWING:
 *
 * 1. Sender ID. BulkSMSBD rejects *masking* sender IDs carrying non-Bengali
 *    text with response code 1012. An English template therefore only works on
 *    a non-masking sender ID — a numeric or dedicated OTP route. If sends start
 *    failing with 1012, that is the cause: the sender ID and this template
 *    disagree, and one of the two has to change.
 *
 * 2. Cost, in our favour. English is GSM-7, so a segment holds 160 characters
 *    instead of the 70 a Bengali (UCS-2) message gets. This template is ~25
 *    characters, comfortably one segment.
 *
 * Nothing is appended — no expiry line, no brand footer. Operator OTP templates
 * are approved as an exact string, and extra text is a common rejection reason.
 * The five-minute expiry is communicated in the UI instead, in Bangla.
 */
export function otpMessage(code: string): string {
  return `Your ${SMS_BRAND} OTP is ${code}`;
}

/**
 * Segment count, so a message change that doubles the bill is visible.
 *
 * Any character outside ASCII forces the whole message to UCS-2. Concatenated
 * messages also lose room to the segmentation header — 153/67 rather than
 * 160/70 — which is why a message that "just fits" at 160 costs two segments
 * at 161, not one and a bit.
 */
export function smsSegments(text: string): number {
  const isUnicode = /[^\x00-\x7f]/.test(text);
  const single = isUnicode ? 70 : 160;
  const concatenated = isUnicode ? 67 : 153;
  if (text.length <= single) return 1;
  return Math.ceil(text.length / concatenated);
}
