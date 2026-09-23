import { loadState } from "@/lib/db/repository";
import { scopeStateForSession } from "@/lib/db/scope";
import { getSession } from "@/lib/auth/session";
import { clientKey, rateLimit, LIMITS } from "@/lib/api/rate-limit";
import { internal, ok, rateLimited } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/**
 * The snapshot the signed-in actor is allowed to see.
 *
 * This used to return the entire database to anyone who asked. It now runs
 * every response through `scopeStateForSession`, so a customer receives their
 * own records plus the public catalogue, a provider receives their jobs plus
 * the open requests they could quote on, and only an admin sees everything.
 */
export async function GET(request: Request) {
  const limit = rateLimit(`read:${clientKey(request)}`, LIMITS.read.limit, LIMITS.read.window);
  if (!limit.ok) return rateLimited(limit.retryAfterSeconds);

  try {
    const session = await getSession();
    const { state, fromDatabase } = await loadState();
    const scoped = scopeStateForSession(state, session);

    // Tell the client who it is, so it doesn't have to guess from the data.
    return ok({
      state: scoped,
      fromDatabase,
      session: session
        ? {
            accountId: session.sub,
            phone: session.phone,
            roles: session.roles,
            activeRole: session.activeRole,
            customerId: session.customerId,
            providerId: session.providerId,
          }
        : null,
    });
  } catch (error) {
    return internal("bootstrap", error);
  }
}
