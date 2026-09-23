"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/app-shell/app-shell";
import { ListSkeleton } from "@/components/skeletons";
import {
  useCustomerById,
  useMessages,
  useProviderById,
  useThreads,
} from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { formatTime } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { EMPTY } from "@/lib/strings";

/**
 * Two-pane messaging, collapsing to one pane on mobile.
 *
 * Shared by both the customer and provider apps — `as` decides whose threads
 * are listed and which side of each bubble the reader is on.
 */
export function MessagesView({
  as,
  initialThreadId,
}: {
  as: "customer" | "provider";
  initialThreadId?: string;
}) {
  const { data: threads, isLoading } = useThreads(as);
  const [activeId, setActiveId] = useState<string | null>(initialThreadId ?? null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { sendMessage, markThreadRead } = useMutations();
  const endRef = useRef<HTMLDivElement>(null);

  const list = threads ?? [];
  const current = activeId ?? list[0]?._id ?? null;
  const { data: messages } = useMessages(current);

  useEffect(() => {
    if (current) markThreadRead(current);
  }, [current, markThreadRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !current) return;
    setSending(true);
    try {
      await sendMessage(current, draft.trim(), as);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="বার্তা" />
        <ListSkeleton count={5} />
      </>
    );
  }

  if (list.length === 0) {
    return (
      <>
        <PageHeader title="বার্তা" />
        <div className="rounded-lg border border-border bg-surface">
          <EmptyState {...EMPTY.messages} icon={<MessageSquare />} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="বার্তা" description="পেশাদারদের সাথে আপনার কথোপকথন।" />

      <div className="grid h-[calc(100vh-16rem)] min-h-[30rem] gap-0 overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-[18rem_1fr]">
        {/* thread list */}
        <ul
          className={cn(
            "divide-y divide-border-subtle overflow-y-auto border-e border-border",
            current && "hidden md:block",
          )}
        >
          {list.map((thread) => (
            <li key={thread._id}>
              <ThreadRow
                as={as}
                threadId={thread._id}
                customerId={thread.customerId}
                providerId={thread.providerId}
                subject={thread.bnSubject}
                lastAt={thread.lastMessageAt}
                active={thread._id === current}
                onSelect={() => setActiveId(thread._id)}
              />
            </li>
          ))}
        </ul>

        {/* conversation */}
        <div className="flex min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto p-5">
            <ul className="flex flex-col gap-3">
              {(messages ?? []).map((m) => {
                const mine = m.senderRole === as;
                const system = m.senderRole === "system";

                if (system) {
                  return (
                    <li key={m._id} className="flex justify-center">
                      <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-fg-tertiary">
                        {m.bnBody}
                      </span>
                    </li>
                  );
                }

                return (
                  <li
                    key={m._id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "flex max-w-[80%] flex-col gap-1 rounded-xl px-4 py-2.5",
                        mine
                          ? "bg-teal-600 text-white"
                          : "bg-surface-muted text-fg",
                      )}
                    >
                      <p className="text-sm">{m.bnBody}</p>
                      <span
                        className={cn(
                          "self-end text-xs tabular",
                          mine ? "text-teal-100" : "text-fg-tertiary",
                        )}
                      >
                        {formatTime(m.sentAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div ref={endRef} />
          </div>

          <form
            onSubmit={send}
            className="flex items-center gap-2.5 border-t border-border-subtle p-4"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="বার্তা লিখুন…"
              aria-label="বার্তা লিখুন"
              className="h-11 flex-1 rounded-md border border-border bg-surface px-3.5 text-base text-fg placeholder:text-fg-disabled focus:border-border-focus focus:shadow-focus focus:outline-none"
            />
            <Button type="submit" loading={sending} disabled={!draft.trim()}>
              <Send aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">পাঠান</span>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

function ThreadRow({
  as,
  customerId,
  providerId,
  subject,
  lastAt,
  active,
  onSelect,
}: {
  as: "customer" | "provider";
  threadId: string;
  customerId: string;
  providerId: string;
  subject: string;
  lastAt: string;
  active: boolean;
  onSelect: () => void;
}) {
  const { data: provider } = useProviderById(as === "customer" ? providerId : null);
  const { data: customer } = useCustomerById(as === "provider" ? customerId : null);
  const other = as === "customer" ? provider : customer;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-focus",
        active ? "bg-teal-50" : "hover:bg-surface-muted",
      )}
    >
      <Avatar id={other?._id ?? ""} name={other?.bnName ?? ""} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate-bn text-sm font-medium text-fg">{other?.bnName}</span>
        <span className="truncate-bn text-xs text-fg-tertiary">{subject}</span>
      </span>
      <span className="shrink-0 text-xs tabular text-fg-disabled">
        <RelativeTime value={lastAt} />
      </span>
    </button>
  );
}
