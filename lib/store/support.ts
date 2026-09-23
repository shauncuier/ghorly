import type { Entities } from "@/lib/store/types";
import type { Message, MessageThread } from "@/lib/types";

/**
 * Support threads: one per customer and one per provider, each with the
 * Ghorly team on the other end. Shared by the reducer (to post into them), the
 * policy (to check who may), and the live-messaging routes and UI, so the
 * "which thread is this person's" rule lives in exactly one place.
 */

export type SupportKind = MessageThread["kind"];

export function supportThreadFor(
  entities: Pick<Entities, "threads">,
  kind: SupportKind,
  partyId: string,
): MessageThread | undefined {
  return Object.values(entities.threads).find((t) =>
    t.kind === kind &&
    (kind === "customer" ? t.customerId === partyId : t.providerId === partyId),
  );
}

/** The party a thread belongs to, whichever kind it is. */
export function threadParty(thread: MessageThread): string | null {
  return thread.kind === "customer" ? thread.customerId : thread.providerId;
}

/**
 * The two ends of every conversation: the customer or provider it belongs to
 * (`party`), and the Ghorly team (`team`). Typing and read receipts are about
 * the *other* end, whoever you are.
 */
export type ThreadSide = "party" | "team";

/** Which end wrote a message. System notices count as the team's. */
export function sideOfMessage(message: Pick<Message, "senderRole">): ThreadSide {
  return message.senderRole === "admin" || message.senderRole === "system" ? "team" : "party";
}

/** Which end a viewer is on, from the role they are acting as. */
export function sideOfViewer(role: "customer" | "provider" | "admin"): ThreadSide {
  return role === "admin" ? "team" : "party";
}
