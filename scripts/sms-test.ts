/**
 * BulkSMSBD connectivity check.
 *
 *   npm run sms:check              → config + balance only, sends nothing
 *   npm run sms:check 01712345678  → also sends one real test message
 *
 * The second form costs money and texts a real phone, so it only runs when a
 * number is passed explicitly.
 */

import { createBulkSmsBd } from "../lib/auth/sms/bulksmsbd";
import { otpMessage, smsSegments } from "../lib/auth/sms/message";

const API_KEY = process.env.BULKSMSBD_API_KEY;
const SENDER_ID = process.env.BULKSMSBD_SENDER_ID;

function mask(value: string): string {
  if (value.length <= 6) return "***";
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

async function main() {
  console.log("\nBulkSMSBD configuration");
  console.log(`  BULKSMSBD_API_KEY   : ${API_KEY ? mask(API_KEY) : "(not set)"}`);
  console.log(`  BULKSMSBD_SENDER_ID : ${SENDER_ID ?? "(not set)"}`);

  if (!API_KEY || !SENDER_ID) {
    console.log(
      "\n⚠ Not configured. The app runs in development OTP mode: codes are\n" +
        "  logged and returned to the login form instead of texted.\n" +
        "  In production the OTP request is refused outright in this state.\n",
    );
    return;
  }

  const provider = createBulkSmsBd(API_KEY, SENDER_ID);

  // Show what a real OTP costs before sending anything.
  const sample = otpMessage("123456");
  console.log(`\nMessage template (${sample.length} chars, ${smsSegments(sample)} segment/s)`);
  console.log(`  "${sample}"`);
  console.log(
    "  BulkSMSBD mandates this exact wording for OTP traffic:\n" +
      "    Your {Brand/Company Name} OTP is XXXX\n" +
      "  English is GSM-7 -> 160 chars per segment. This template only\n" +
      "  works on a NON-masking sender ID; masking IDs require Bengali\n" +
      "  text and reject this with response code 1012.",
  );

  const balance = await provider.balance?.();
  console.log(`\nBalance: ${balance === null || balance === undefined ? "unavailable" : balance}`);

  const target = process.argv[2];
  if (!target) {
    console.log("\nNo number given — nothing sent.");
    console.log("To send one real test message:  npm run sms:check 01XXXXXXXXX\n");
    return;
  }

  if (!/^01[3-9]\d{8}$/.test(target)) {
    console.error(`\n✗ "${target}" is not a valid Bangladeshi mobile number.\n`);
    process.exit(1);
  }

  console.log(`\nSending a test message to ${target} …`);
  const result = await provider.send(target, otpMessage("000000"));

  if (result.ok) {
    console.log(`✓ accepted by the gateway (code ${result.code})`);
    if (result.reference) console.log(`  reference: ${result.reference}`);
    console.log("");
  } else {
    console.error(`✗ rejected (code ${result.code}): ${result.message}`);
    console.error(`  retryable: ${result.retryable ? "yes" : "no"}\n`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\n✗", e instanceof Error ? e.message : e, "\n");
  process.exit(1);
});
