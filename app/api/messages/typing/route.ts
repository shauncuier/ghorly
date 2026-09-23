import { threadForCaller } from "@/lib/api/thread-access";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { fail, internal, ok, rateLimited } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/** How long one ping keeps "typing…" alive if no further ping arrives. */
const TYPING_TTL_MS = 8_000;

let indexReady: Promise<unknown> | null = null;

/**
 * "I'm typing in this thread."
 *
 * The browser pings this every few seconds while the composer has input. It
 * upserts one short-lived document per thread and side, which a TTL index
 * sweeps away; the change stream in /api/messages/stream relays each ping to
 * the other end. It goes through the database, not memory, because on a
 * serverless host the typist and the reader are usually on different
 * instances.
 */
export async function POST(request: Request) {
  // Clients throttle to one ping per ~3 s; this only stops a runaway loop.
  const limit = rateLimit(`typing:${clientKey(request)}`, 60, 60);
  if (!limit.ok) return rateLimited(limit.retryAfterSeconds);

  let body: { threadId?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("invalid", "অনুরোধটি পড়া যায়নি।");
  }

  const access = await threadForCaller(body.threadId);
  if ("error" in access) return access.error;
  const { db, thread, side } = access;

  try {
    const typing = db.collection("typing");
    indexReady ??= typing
      .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
      .catch(() => (indexReady = null));
    await indexReady;

    const now = Date.now();
    await typing.updateOne(
      { _id: `${thread._id}:${side}` } as never,
      {
        $set: {
          threadId: thread._id,
          side,
          at: new Date(now),
          expireAt: new Date(now + TYPING_TTL_MS),
        },
      },
      { upsert: true },
    );
    return ok({ typing: true });
  } catch (error) {
    return internal("messages-typing", error);
  }
}
