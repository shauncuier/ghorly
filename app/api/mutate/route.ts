import { loadState, persistChanges } from "@/lib/db/repository";
import { scopeStateForSession } from "@/lib/db/scope";
import { getSession } from "@/lib/auth/session";
import { authorize } from "@/lib/auth/policy";
import { ActionSchema } from "@/lib/api/validation";
import { clientKey, rateLimit, LIMITS } from "@/lib/api/rate-limit";
import { fail, internal, ok, rateLimited } from "@/lib/api/respond";
import { reducer } from "@/lib/store/reducer";
import type { Action } from "@/lib/store/actions";
import type { AppState } from "@/lib/store/types";
import type { Session } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

/**
 * Applies one action against MongoDB.
 *
 * Four gates before anything is written, in this order — cheapest and most
 * cacheable first, most expensive last:
 *
 *   1. rate limit      — bound the damage a single caller can do
 *   2. authentication  — who is this
 *   3. schema          — is the payload even the right shape (runtime, not just TS)
 *   4. authorization   — may *this* actor do *this* to *this record*
 *
 * Only then does the server run the same reducer the browser runs, and persist
 * the documents whose identity changed. Those cascades — accepting a quote
 * declines its siblings, creates a booking and a pending payment — are written
 * down once, in `lib/store/reducer.ts`, and re-expressing them as Mongo update
 * pipelines would be the same logic drifting apart.
 */
export async function POST(request: Request) {
  const limit = rateLimit(
    `mutate:${clientKey(request)}`,
    LIMITS.mutate.limit,
    LIMITS.mutate.window,
  );
  if (!limit.ok) return rateLimited(limit.retryAfterSeconds);

  const session = await getSession();
  if (!session) {
    return fail("unauthenticated", "লগ ইন করুন।");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("invalid", "অনুরোধটি পড়া যায়নি।");
  }

  // The `Action` union is a compile-time promise about our own code; over the
  // wire this is just JSON, so it has to be parsed, not asserted.
  const parsed = ActionSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("invalid", "পাঠানো তথ্য সঠিক নয়।");
  }
  const action = parsed.data as Action;

  try {
    const { state: before, fromDatabase } = await loadState();

    if (!fromDatabase) {
      // No database: say so rather than letting the client believe it wrote.
      return ok({
        state: scopeStateForSession(before, session),
        fromDatabase: false,
        persisted: 0,
      });
    }

    // Authorization runs against real state, not against what the caller
    // claimed — a request can name any id, so ownership is looked up.
    const decision = authorize(session, action, before);
    if (!decision.allow) {
      return fail("forbidden", decision.reason ?? "অনুমতি নেই।");
    }

    const after = reduceForSession(before, action, session);
    const { written } = await persistChanges(before, after);

    return ok({
      state: scopeStateForSession(after, session),
      fromDatabase: true,
      persisted: written,
    });
  } catch (error) {
    return internal("mutate", error);
  }
}

/**
 * Runs the reducer with the session's own ids substituted in.
 *
 * The reducer reads `state.session.customerId` / `providerId` for actions like
 * `SUBMIT_REQUEST` and `UPDATE_PROVIDER_PROFILE`. On the server that must come
 * from the verified cookie, never from the request body — otherwise a caller
 * could submit a request as somebody else.
 */
function reduceForSession(
  state: AppState,
  action: Action,
  session: Session,
): AppState {
  const authoritative: AppState = {
    ...state,
    session: {
      role: session.activeRole,
      customerId: session.customerId ?? "",
      providerId: session.providerId ?? "",
    },
  };

  const next = reducer(authoritative, action);
  // Keep the stored session block stable — it is derived from the cookie, not
  // persisted state.
  return { ...next, session: state.session };
}
