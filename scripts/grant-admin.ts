/**
 * Grants (or revokes) admin on the account for a phone number.
 *
 *     npm run admin:grant -- 01XXXXXXXXX
 *     npm run admin:grant -- 01XXXXXXXXX --revoke
 *
 * Admin is a flag on the account, not a profile, so this is the only way one
 * comes into existence — self-service sign-up never produces an admin. If the
 * number has no account yet, one is created with admin only; signing in with
 * that number (phone + OTP) then lands on /admin. If the number already owns a
 * customer or provider record, that stays linked and the account can switch
 * between roles.
 *
 * Takes effect on the next request: writes re-read the account, so there is no
 * need to sign out, and a revoke stops admin writes immediately.
 */

import { requireDb, closeDb } from "../lib/db/client";

/** Same rule as `normalisePhone` in lib/auth/otp.ts (not importable here: server-only). */
function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local = digits.startsWith("880") ? digits.slice(3) : digits;
  const withZero = local.startsWith("0") ? local : `0${local}`;
  return /^01[3-9]\d{8}$/.test(withZero) ? withZero : null;
}

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const raw = args.find((a) => !a.startsWith("--"));

  const phone = raw ? normalisePhone(raw) : null;
  if (!phone) {
    console.error("Usage: npm run admin:grant -- 01XXXXXXXXX [--revoke]");
    process.exitCode = 1;
    return;
  }

  const db = await requireDb();
  const accounts = db.collection("accounts");
  const now = new Date().toISOString().slice(0, 16);
  const existing = (await accounts.findOne({ phone } as never)) as
    | { _id: string; isAdmin: boolean; customerId: string | null; providerId: string | null }
    | null;

  if (revoke) {
    if (!existing?.isAdmin) {
      console.log(`${phone} is not an admin — nothing to do.`);
    } else if (!existing.customerId && !existing.providerId) {
      // An admin-only account with the flag removed would hold no role at all.
      await accounts.updateOne({ _id: existing._id } as never, {
        $set: { isAdmin: false, status: "suspended", updatedAt: now },
      });
      console.log(`✓ revoked admin for ${phone} (admin-only account, now suspended)`);
    } else {
      await accounts.updateOne({ _id: existing._id } as never, {
        $set: { isAdmin: false, updatedAt: now },
      });
      console.log(`✓ revoked admin for ${phone}`);
    }
    await closeDb();
    return;
  }

  if (existing) {
    await accounts.updateOne({ _id: existing._id } as never, {
      $set: { isAdmin: true, status: "active", updatedAt: now },
    });
    console.log(`✓ ${phone} is now an admin (existing account ${existing._id})`);
    if (existing.customerId || existing.providerId) {
      console.log("  Signs in as customer/provider first — switch to প্রশাসক from the account menu.");
    }
  } else {
    // Link any customer/provider record already carrying this number, the same
    // way a first sign-in would.
    const customer = (await db.collection("customers").findOne({ phone } as never)) as { _id: string } | null;
    const provider = (await db.collection("providers").findOne({ phone } as never)) as { _id: string } | null;
    await accounts.insertOne({
      _id: `acc-${phone}`,
      phone,
      bnName: "প্রশাসক",
      customerId: customer?._id ?? null,
      providerId: provider?._id ?? null,
      isAdmin: true,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    } as never);
    console.log(`✓ created admin account for ${phone}`);
  }

  console.log("  Sign in at /login with this number; the OTP goes to it by SMS.");
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exitCode = 1;
});
