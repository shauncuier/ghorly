import "server-only";

import type { Db } from "mongodb";
import { getSession } from "@/lib/auth/session";
import { refreshSession } from "@/lib/auth/accounts";
import { getDb } from "@/lib/db/client";
import { fail } from "@/lib/api/respond";
import { sideOfViewer, type ThreadSide } from "@/lib/store/support";
import type { Session } from "@/lib/auth/types";
import type { MessageThread } from "@/lib/types";

/**
 * Who may see a support thread — the same rule as the read scope in
 * lib/db/scope.ts, applied to one thread: the admin sees every thread, a
 * customer or provider only their own.
 */
export function canSeeThread(session: Session, thread: MessageThread): boolean {
  if (session.roles.includes("admin")) return true;
  if (thread.kind === "customer") {
    return Boolean(session.customerId && thread.customerId === session.customerId);
  }
  return Boolean(session.providerId && thread.providerId === session.providerId);
}

/**
 * Which end of the thread this session writes from. An admin acting as admin
 * is the team; otherwise they must own the thread as its party.
 */
export function viewerSide(session: Session, thread: MessageThread): ThreadSide | null {
  if (session.activeRole === "admin" && session.roles.includes("admin")) return "team";
  const owns =
    thread.kind === "customer"
      ? Boolean(session.customerId && thread.customerId === session.customerId)
      : Boolean(session.providerId && thread.providerId === session.providerId);
  return owns ? sideOfViewer(thread.kind) : null;
}

/** The live, re-checked session — or a ready-made error response. */
export async function liveSession(): Promise<
  { session: Session; db: Db } | { error: Response }
> {
  const cookie = await getSession();
  const session = cookie ? await refreshSession(cookie) : null;
  if (!session) return { error: fail("unauthenticated", "লগ ইন করুন।") };
  const db = await getDb();
  if (!db) return { error: fail("unavailable", "ডেটাবেস পাওয়া যায়নি।") };
  return { session, db };
}

/** Loads a thread and the caller's side of it, refusing anyone who isn't on it. */
export async function threadForCaller(threadId: unknown): Promise<
  | { session: Session; db: Db; thread: MessageThread; side: ThreadSide }
  | { error: Response }
> {
  if (typeof threadId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(threadId)) {
    return { error: fail("invalid", "কথোপকথনটি সঠিক নয়।") };
  }
  const live = await liveSession();
  if ("error" in live) return live;

  const thread = (await live.db
    .collection("threads")
    .findOne({ _id: threadId } as never)) as unknown as MessageThread | null;
  // "Not found" and "not yours" look the same from outside.
  if (!thread) return { error: fail("not_found", "কথোপকথনটি খুঁজে পাওয়া যায়নি।") };
  const side = viewerSide(live.session, thread);
  if (!side) return { error: fail("not_found", "কথোপকথনটি খুঁজে পাওয়া যায়নি।") };

  return { ...live, thread, side };
}
