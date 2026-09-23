import type { Entities } from "@/lib/store/types";
import type { MessageThread } from "@/lib/types";

/**
 * Support threads: one per customer and one per provider, each with the
 * Ghorly team on the other end. Shared by the reducer (to post into them) and
 * the policy (to check who may), so the "which thread is this person's" rule
 * lives in exactly one place.
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
