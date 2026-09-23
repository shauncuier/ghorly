import { getSession } from "@/lib/auth/session";
import { refreshSession } from "@/lib/auth/accounts";
import { getDb } from "@/lib/db/client";
import { fail } from "@/lib/api/respond";
import type { Session } from "@/lib/auth/types";
import type { Message, MessageThread } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Serverless platforms cap how long a function may run (Vercel: `maxDuration`).
 * The stream ends itself a little before that; `EventSource` reconnects within
 * seconds and the client re-fetches state on reconnect, so nothing is missed.
 */
export const maxDuration = 300;
const STREAM_LIFETIME_MS = (maxDuration - 20) * 1000;

/** Comments keep proxies and the browser from timing an idle stream out. */
const HEARTBEAT_MS = 25_000;

/**
 * Live messages, as server-sent events.
 *
 * Holds a MongoDB change stream on `messages` for as long as the browser keeps
 * the connection, and forwards each newly inserted message — with its thread —
 * to this session *only if* the session may see that thread: a customer or
 * provider their own support thread, the admin every thread. That check runs
 * per event, against the thread as stored, so nothing leaks between parties.
 *
 * Change streams need a replica set (Atlas, or a local `mongod --replSet`). On a
 * standalone server the stream sends `event: unsupported` and closes, and the
 * browser falls back to polling.
 *
 * `EventSource` reconnects on its own, so a platform that caps request
 * duration only costs a brief reconnect, not lost messages: the client
 * re-fetches state whenever it reconnects.
 */
export async function GET(request: Request) {
  const cookieSession = await getSession();
  const session = cookieSession ? await refreshSession(cookieSession) : null;
  if (!session) return fail("unauthenticated", "লগ ইন করুন।");

  const db = await getDb();
  if (!db) return fail("unavailable", "ডেটাবেস পাওয়া যায়নি।");

  const encoder = new TextEncoder();
  let cleanup: () => Promise<void> = async () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const changes = db.collection("messages").watch(
        [{ $match: { operationType: "insert" } }],
        { fullDocument: "default" },
      );
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": ping\n\n"));
      }, HEARTBEAT_MS);

      const lifetime = setTimeout(() => void cleanup(), STREAM_LIFETIME_MS);

      cleanup = async () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        clearTimeout(lifetime);
        await changes.close().catch(() => {});
        try {
          controller.close();
        } catch {
          // already closed by the client
        }
      };
      request.signal.addEventListener("abort", () => void cleanup());

      changes.on("change", async (change) => {
        if (change.operationType !== "insert") return;
        const message = change.fullDocument as unknown as Message;
        const thread = (await db
          .collection("threads")
          .findOne({ _id: message.threadId } as never)) as unknown as MessageThread | null;
        if (!thread || !canSee(session, thread)) return;
        send("message", { message, thread });
      });

      changes.on("error", (error: { code?: number; message?: string }) => {
        // 40573 / "replica set": change streams unavailable on this server.
        const unsupported =
          error?.code === 40573 || /replica set|change stream/i.test(error?.message ?? "");
        send(unsupported ? "unsupported" : "error", {});
        void cleanup();
      });

      send("ready", {});
    },
    async cancel() {
      await cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      // Stop reverse proxies (nginx) buffering the stream into silence.
      "X-Accel-Buffering": "no",
    },
  });
}

/** Same rule as the read scope in lib/db/scope.ts, applied to one thread. */
function canSee(session: Session, thread: MessageThread): boolean {
  if (session.roles.includes("admin")) return true;
  if (thread.kind === "customer") {
    return Boolean(session.customerId && thread.customerId === session.customerId);
  }
  return Boolean(session.providerId && thread.providerId === session.providerId);
}
