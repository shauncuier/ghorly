import { getDb } from "@/lib/db/client";
import { ok } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/**
 * Liveness + readiness for a load balancer or uptime check.
 *
 * Deliberately says nothing about hostnames, versions or credentials — a
 * health endpoint is public by nature, so it reports status and latency only.
 */
export async function GET() {
  const started = Date.now();
  const db = await getDb();

  let database: "up" | "down" = "down";
  if (db) {
    try {
      await db.command({ ping: 1 });
      database = "up";
    } catch {
      database = "down";
    }
  }

  return ok(
    {
      status: database === "up" ? "ok" : "degraded",
      database,
      latencyMs: Date.now() - started,
    },
    // A degraded response should still be a 200 for liveness; readiness
    // probes can key off the `status` field.
    {},
  );
}
