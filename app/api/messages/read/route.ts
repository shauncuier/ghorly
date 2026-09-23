import { threadForCaller } from "@/lib/api/thread-access";
import { clientKey, rateLimit, LIMITS } from "@/lib/api/rate-limit";
import { fail, internal, ok, rateLimited } from "@/lib/api/respond";
import { currentNaiveLocal } from "@/lib/data/clock";

export const dynamic = "force-dynamic";

/**
 * Marks the other end's messages in a thread as read — the ✓✓ receipt.
 *
 * Written straight to `messages` rather than through /api/mutate: a receipt
 * must never contend with a message being sent to the same thread (the thread
 * document's version check would make one of them fail). Each updated message
 * becomes a change-stream event, which the stream turns into a receipt for
 * the sender.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`read:${clientKey(request)}`, LIMITS.mutate.limit, LIMITS.mutate.window);
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
    // The reader marks what the *other* end wrote.
    const theirRoles = side === "team" ? [thread.kind] : ["admin", "system"];
    const readAt = currentNaiveLocal();
    const result = await db.collection("messages").updateMany(
      { threadId: thread._id, isRead: { $ne: true }, senderRole: { $in: theirRoles } } as never,
      { $set: { isRead: true, readAt }, $inc: { _v: 1 } } as never,
    );
    return ok({ marked: result.modifiedCount, readAt });
  } catch (error) {
    return internal("messages-read", error);
  }
}
