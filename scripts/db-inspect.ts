/**
 * Ad-hoc look inside the database. `npm run db:inspect`
 *
 * Prints the UI meta document plus a few spot values, so you can confirm from
 * the terminal that something you just did in the browser actually landed in
 * MongoDB rather than only in that tab's offline cache.
 */

import { requireDb, closeDb } from "../lib/db/client";

async function main() {
  const db = await requireDb();

  const meta = await db.collection("_appMeta").findOne({ _id: "ui" } as never);
  const ui = (meta as unknown as { ui?: Record<string, unknown> })?.ui;

  console.log("\n_appMeta.ui");
  console.log("  favorites:", JSON.stringify(ui?.favorites ?? null));
  console.log("  unreadByThread:", JSON.stringify(ui?.unreadByThread ?? null));
  console.log("  requestDraft:", ui?.requestDraft ? "present" : "null");

  const verified = await db
    .collection("providers")
    .countDocuments({ isVerified: true } as never);
  const pendingVer = await db
    .collection("verifications")
    .countDocuments({ status: "pending" } as never);
  const openReq = await db
    .collection("requests")
    .countDocuments({ status: "open" } as never);
  const quotedReq = await db
    .collection("requests")
    .countDocuments({ status: "quoted" } as never);

  console.log("\ncounts");
  console.log("  providers.isVerified=true :", verified);
  console.log("  verifications pending    :", pendingVer);
  console.log("  requests open            :", openReq);
  console.log("  requests quoted          :", quotedReq);
  console.log("");

  await closeDb();
}

main().catch(async (e) => {
  console.error("\n✗", e instanceof Error ? e.message : e, "\n");
  await closeDb().catch(() => {});
  process.exit(1);
});
