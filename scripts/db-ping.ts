/**
 * Connection check. `npm run db:ping`
 *
 * Verifies the configured MongoDB is reachable and reports what is in it,
 * without ever printing the password.
 */

import { requireDb, closeDb, DB_NAME, MONGODB_URI, isAtlas, redactUri } from "../lib/db/client";
import { COLLECTIONS } from "../lib/db/collections";

async function main() {
  console.log(`→ ${isAtlas ? "Atlas" : "local"}  ${redactUri(MONGODB_URI)}`);
  console.log(`→ database: ${DB_NAME}\n`);

  const started = Date.now();
  const db = await requireDb();
  await db.command({ ping: 1 });
  console.log(`✓ connected in ${Date.now() - started}ms\n`);

  let total = 0;
  for (const name of COLLECTIONS) {
    const count = await db.collection(name).countDocuments();
    total += count;
    console.log(`  ${name.padEnd(14)} ${String(count).padStart(4)}`);
  }

  console.log(`\n${total === 0 ? "⚠ empty — run `npm run db:seed`" : `✓ ${total} documents`}\n`);
  await closeDb();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n✗ ${redactUri(message)}\n`);

  if (message.includes("Authentication failed") || message.includes("bad auth")) {
    console.error("  Wrong username or password in MONGODB_URI.");
    console.error("  If the password has special characters, percent-encode it.\n");
  } else if (message.includes("ENOTFOUND") || message.includes("querySrv")) {
    console.error("  Cluster hostname not resolving — check the SRV string.\n");
  } else if (message.includes("timed out") || message.includes("ServerSelection")) {
    console.error("  Unreachable. For Atlas, add your current IP under");
    console.error("  Network Access. For local, check: Get-Service MongoDB\n");
  }

  await closeDb().catch(() => {});
  process.exit(1);
});
