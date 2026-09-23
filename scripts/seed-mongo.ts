/**
 * Seeds MongoDB from the in-repo seed data and creates the indexes.
 *
 * Run with `npm run db:seed`. Safe to re-run: every collection is dropped and
 * rebuilt, so the database always matches `lib/data/` exactly.
 *
 * Unlike the rest of the app this *should* fail loudly — a seed script that
 * silently does nothing when the database is unreachable is worse than useless.
 */

import { requireDb, closeDb, DB_NAME, MONGODB_URI, redactUri } from "../lib/db/client";
import {
  AUTH_INDEXES,
  COLLECTIONS,
  INDEXES,
  UNIQUE_INDEXES,
} from "../lib/db/collections";
import { buildInitialState } from "../lib/store/initial-state";

async function main() {
  // Redacted: an Atlas URI carries the password, and this goes to a terminal
  // and often into a screenshot or a CI log.
  console.log(`→ connecting to ${redactUri(MONGODB_URI)} (db: ${DB_NAME})`);
  const db = await requireDb();

  const state = buildInitialState();
  let totalDocs = 0;
  let totalIndexes = 0;

  for (const name of COLLECTIONS) {
    const docs = state.order[name].map((id) => state.entities[name][id]);
    const collection = db.collection(name);

    // Drop rather than deleteMany: dropping clears the indexes too, so a
    // changed index definition doesn't collide with a leftover one from a
    // previous run. `NamespaceNotFound` just means it wasn't there yet.
    await collection.drop().catch((e: { codeName?: string }) => {
      if (e?.codeName !== "NamespaceNotFound") throw e;
    });

    if (docs.length > 0) {
      await collection.insertMany(docs as never[], { ordered: false });
      totalDocs += docs.length;
    }

    for (const spec of INDEXES[name] ?? []) {
      await collection.createIndex(spec);
      totalIndexes += 1;
    }

    const uniqueField = UNIQUE_INDEXES[name];
    if (uniqueField) {
      await collection.createIndex({ [uniqueField]: 1 }, { unique: true });
      totalIndexes += 1;
    }

    console.log(
      `  ${name.padEnd(14)} ${String(docs.length).padStart(4)} docs` +
        `  ${(INDEXES[name] ?? []).length + (uniqueField ? 1 : 0)} indexes`,
    );
  }

  // UI state (favourites, unread counts) starts from the seed too.
  await db
    .collection("_appMeta")
    .replaceOne({ _id: "ui" as never }, { _id: "ui", ui: { counters: state.ui.counters } } as never, {
      upsert: true,
    });

  // Auth collections are not seeded — accounts are created on first login —
  // but they still need their indexes, including the TTL that expires OTPs.
  for (const { collection, spec, options } of AUTH_INDEXES) {
    await db.collection(collection).createIndex(spec, options ?? {});
    totalIndexes += 1;
  }
  console.log("  accounts       unique phone index");
  console.log("  otpChallenges  TTL index on expiry");

  console.log(
    `\n✓ seeded ${totalDocs} documents across ${COLLECTIONS.length} collections, ${totalIndexes} indexes\n`,
  );

  await closeDb();
}

main().catch(async (error) => {
  console.error("\n✗ seed failed:", error instanceof Error ? error.message : error);
  console.error(
    "\n  Is mongod running? On Windows: Get-Service MongoDB\n" +
      "  Override the target with MONGODB_URI / MONGODB_DB.\n",
  );
  await closeDb().catch(() => {});
  process.exit(1);
});
