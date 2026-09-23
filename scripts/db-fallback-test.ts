/**
 * Checks the offline path: with an unreachable database, `getDb()` must return
 * null quickly rather than throwing or hanging, so callers fall back to the
 * in-memory seed and the prototype stays demonstrable.
 *
 * Run: npm run db:fallback
 */

import { getDb, closeDb, MONGODB_URI, redactUri } from "../lib/db/client";

async function main() {
  console.log(`→ target: ${redactUri(MONGODB_URI)}`);
  console.log("  (set MONGODB_URI to an unused port to exercise the failure path)\n");

  const started = Date.now();
  const db = await getDb();
  const elapsed = Date.now() - started;

  if (db === null) {
    console.log(`✓ getDb() → null after ${elapsed}ms — callers fall back to the seed`);
    console.log("  The app will render in ডেমো মোড with sample data.\n");
  } else {
    console.log(`✓ getDb() → connected in ${elapsed}ms`);
    const count = await db.collection("providers").countDocuments();
    console.log(`  providers collection: ${count} documents\n`);
  }

  // Second call should be served from the failure cooldown / connection cache.
  const t2 = Date.now();
  await getDb();
  console.log(`  second call: ${Date.now() - t2}ms (cached)\n`);

  await closeDb();
}

main().catch(async (e) => {
  console.error("\n✗ getDb() threw — it should never throw:", e);
  await closeDb().catch(() => {});
  process.exit(1);
});
