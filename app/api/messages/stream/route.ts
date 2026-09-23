import { canSeeThread, liveSession, viewerSide } from "@/lib/api/thread-access";
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
 * Live messaging, as server-sent events.
 *
 * Holds one MongoDB change stream (on `messages` and `typing`) for as long as
 * the browser keeps the connection, and forwards three kinds of event — each
 * only if this session may see the thread (a customer or provider their own
 * support thread, the admin every thread), checked per event against the
 * thread as stored:
 *
 *   message — a new message, with its thread
 *   read    — the other end read one of your messages (✓✓)
 *   typing  — the other end is typing
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
  const live = await liveSession();
  if ("error" in live) return live.error;
  const { session, db } = live;

  const encoder = new TextEncoder();
  let cleanup: () => Promise<void> = async () => {};

  // Thread visibility doesn't change during a connection; typing pings are
  // frequent, so don't look the same thread up every few seconds.
  const threads = new Map<string, MessageThread | null>();
  async function threadFor(id: string): Promise<MessageThread | null> {
    if (!threads.has(id)) {
      const t = (await db
        .collection("threads")
        .findOne({ _id: id } as never)) as unknown as MessageThread | null;
      threads.set(id, t && canSeeThread(session, t) ? t : null);
    }
    return threads.get(id) ?? null;
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const changes = db.watch(
        [
          {
            $match: {
              "ns.coll": { $in: ["messages", "typing"] },
              operationType: { $in: ["insert", "update", "replace"] },
            },
          },
        ],
        // Updates carry only the changed fields; look the document up so a
        // receipt knows which thread it belongs to.
        { fullDocument: "updateLookup" },
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
        if (!("ns" in change) || !("fullDocument" in change) || !change.fullDocument) return;
        const coll = change.ns.coll;

        if (coll === "messages") {
          const message = change.fullDocument as unknown as Message;
          const thread = await threadFor(message.threadId);
          if (!thread) return;
          if (change.operationType === "insert") {
            send("message", { message, thread });
          } else if (message.isRead) {
            send("read", {
              threadId: thread._id,
              messageId: message._id,
              readAt: message.readAt ?? null,
            });
          }
          return;
        }

        // typing — relay the *other* end's pings only.
        const ping = change.fullDocument as unknown as { threadId: string; side: string };
        const thread = await threadFor(ping.threadId);
        if (!thread || viewerSide(session, thread) === ping.side) return;
        send("typing", { threadId: thread._id, side: ping.side });
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
