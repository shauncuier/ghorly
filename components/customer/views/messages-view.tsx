"use client";

import { useEffect, useRef, useState } from "react";
import { Headset, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import type { MessageThread } from "@/lib/types";

type Viewer = "customer" | "provider" | "admin";

/**
 * Support messaging.
 *
 * Customers and providers never talk to each other — every conversation is
 * with the Ghorly team. So a customer or provider sees one conversation (theirs
 * with support, opened by their first message), while the admin sees an inbox
 * of every customer's and provider's thread.
 */
export function MessagesView({ as }: { as: Viewer }) {
  const { data: threads, isLoading } = useThreads(as);
  const list = threads ?? [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="বার্তা" />
        <ListSkeleton count={5} />
      </>
    );
  }

  if (as !== "admin") {
    return (
      <>
        <PageHeader
          title="বার্তা"
          description="যেকোনো প্রশ্ন বা সমস্যায় ঘরলি টিমকে লিখুন — আমরাই পেশাদারের সাথে যোগাযোগ রাখি।"
        />
        <div className="flex h-[calc(100vh-16rem)] min-h-[30rem] flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-3.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <Headset className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-fg">ঘরলি সাপোর্ট</span>
              <span className="text-xs text-fg-tertiary">সাধারণত কয়েক ঘণ্টার মধ্যে উত্তর দিই</span>
            </span>
          </div>
          <Conversation as={as} thread={list[0] ?? null} />
        </div>
      </>
    );
  }

  return <AdminInbox threads={list} />;
}

function AdminInbox({ threads }: { threads: MessageThread[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const current = threads.find((t) => t._id === activeId) ?? threads[0] ?? null;

  if (threads.length === 0) {
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
      <PageHeader title="বার্তা" description="গ্রাহক ও পেশাদারদের সাথে সব কথোপকথন।" />

      <div className="grid h-[calc(100vh-16rem)] min-h-[30rem] gap-0 overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-[20rem_1fr]">
        <ul
          className={cn(
            "divide-y divide-border-subtle overflow-y-auto border-e border-border",
            activeId && "hidden md:block",
          )}
        >
          {threads.map((thread) => (
            <li key={thread._id}>
              <ThreadRow
                thread={thread}
                active={thread._id === current?._id}
                onSelect={() => setActiveId(thread._id)}
              />
            </li>
          ))}
        </ul>

        <div className="flex min-h-0 flex-col">
          {current ? <Conversation as="admin" thread={current} /> : null}
        </div>
      </div>
    </>
  );
}

function Conversation({ as, thread }: { as: Viewer; thread: MessageThread | null }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { sendMessage, markThreadRead } = useMutations();
  const endRef = useRef<HTMLDivElement>(null);
  const threadId = thread?._id ?? null;
  const { data: messages } = useMessages(threadId);

  useEffect(() => {
    if (threadId) markThreadRead(threadId);
  }, [threadId, markThreadRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      // No thread yet: the first message opens the sender's support thread.
      await sendMessage({ threadId: threadId ?? undefined, body, role: as });
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  const list = messages ?? [];

  return (
    <>
      <div className="flex-1 overflow-y-auto p-5">
        {list.length === 0 ? (
          <p className="mx-auto mt-10 max-w-sm text-center text-sm text-fg-tertiary">
            এখনো কোনো বার্তা নেই। কাজ, সময় বা দাম নিয়ে যেকোনো প্রশ্ন এখানে লিখুন।
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((m) => {
              const mine = m.senderRole === as;

              if (m.senderRole === "system") {
                return (
                  <li key={m._id} className="flex justify-center">
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-center text-xs text-fg-tertiary">
                      {m.bnBody}
                    </span>
                  </li>
                );
              }

              return (
                <li key={m._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "flex max-w-[80%] flex-col gap-1 rounded-xl px-4 py-2.5",
                      mine ? "bg-teal-600 text-white" : "bg-surface-muted text-fg",
                    )}
                  >
                    {!mine && m.senderRole === "admin" ? (
                      <span className="text-xs font-semibold text-teal-700">ঘরলি টিম</span>
                    ) : null}
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
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2.5 border-t border-border-subtle p-4">
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
    </>
  );
}

/** Admin inbox row: who the conversation is with, and which side they're on. */
function ThreadRow({
  thread,
  active,
  onSelect,
}: {
  thread: MessageThread;
  active: boolean;
  onSelect: () => void;
}) {
  const { data: customer } = useCustomerById(thread.kind === "customer" ? thread.customerId : null);
  const { data: provider } = useProviderById(thread.kind === "provider" ? thread.providerId : null);
  const party = thread.kind === "customer" ? customer : provider;

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
      <Avatar id={party?._id ?? ""} name={party?.bnName ?? ""} size="sm" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate-bn text-sm font-medium text-fg">{party?.bnName}</span>
        <Badge tone={thread.kind === "customer" ? "accent" : "neutral"} className="self-start">
          {thread.kind === "customer" ? "গ্রাহক" : "পেশাদার"}
        </Badge>
      </span>
      <span className="shrink-0 text-xs tabular text-fg-disabled">
        <RelativeTime value={thread.lastMessageAt} />
      </span>
    </button>
  );
}
