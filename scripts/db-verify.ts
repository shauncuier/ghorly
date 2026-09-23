/**
 * End-to-end check that a mutation posted to the API actually lands in
 * MongoDB. `npm run db:verify` (requires the dev server running).
 *
 * Picks a provider whose verification is still pending, approves it through
 * `POST /api/mutate`, and re-reads the database to confirm both the
 * verification and the denormalised `provider.isVerified` flag changed — i.e.
 * that the reducer's cascade ran server-side and persisted.
 *
 * `/api/mutate` now requires an authenticated admin session, so this needs a
 * session cookie. Pass one from a signed-in admin browser session:
 *
 *     GHORLY_SESSION=<cookie value> npm run db:verify
 *
 * Without it the script asserts the endpoint correctly refuses — which is
 * itself a useful check that the auth gate is live.
 */

import { requireDb, closeDb } from "../lib/db/client";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

async function main() {
  const db = await requireDb();

  const pending = await db
    .collection("verifications")
    .findOne({ status: "pending" } as never);

  if (!pending) {
    console.log("No pending verification to test with. Run `npm run db:seed` first.");
    await closeDb();
    return;
  }

  const verificationId = (pending as unknown as { _id: string })._id;
  const providerId = (pending as unknown as { providerId: string }).providerId;

  const before = await db.collection("providers").findOne({ _id: providerId } as never);
  console.log(`\nBEFORE  verification=${verificationId}  provider=${providerId}`);
  console.log(`        status=${(pending as unknown as { status: string }).status}`);
  console.log(`        provider.isVerified=${(before as unknown as { isVerified: boolean })?.isVerified}`);

  const sessionCookie = process.env.GHORLY_SESSION;

  const res = await fetch(`${BASE}/api/mutate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionCookie ? { Cookie: `ghorly_session=${sessionCookie}` } : {}),
    },
    body: JSON.stringify({
      type: "APPROVE_VERIFICATION",
      verificationId,
      at: "2026-03-15T10:00",
    }),
  });

  // Without a session the endpoint must refuse — assert that instead, since
  // it is the more important property now.
  if (!sessionCookie) {
    const refused = res.status === 401;
    console.log(`\nPOST /api/mutate (no session) → ${res.status}`);
    console.log(
      refused
        ? "\n✓ auth gate is live — unauthenticated writes are refused.\n" +
            "  Supply GHORLY_SESSION from an admin session to test the cascade.\n"
        : `\n✗ expected 401 without a session, got ${res.status}\n`,
    );
    await closeDb();
    if (!refused) process.exit(1);
    return;
  }

  const body = (await res.json()) as { fromDatabase: boolean; persisted: number };
  console.log(`\nPOST /api/mutate → ${res.status}  fromDatabase=${body.fromDatabase}  persisted=${body.persisted}`);

  const afterV = await db.collection("verifications").findOne({ _id: verificationId } as never);
  const afterP = await db.collection("providers").findOne({ _id: providerId } as never);

  const vStatus = (afterV as unknown as { status: string })?.status;
  const pVerified = (afterP as unknown as { isVerified: boolean })?.isVerified;

  console.log(`\nAFTER   verification.status=${vStatus}`);
  console.log(`        provider.isVerified=${pVerified}`);

  const ok = vStatus === "approved" && pVerified === true;
  console.log(
    ok
      ? "\n✓ cascade persisted to MongoDB — reducer ran server-side and both documents were written\n"
      : "\n✗ cascade did NOT persist\n",
  );

  await closeDb();
  if (!ok) process.exit(1);
}

main().catch(async (e) => {
  console.error("\n✗", e instanceof Error ? e.message : e, "\n");
  await closeDb().catch(() => {});
  process.exit(1);
});
