import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { Role } from "@/lib/types";

/**
 * Server-side role guard for the three dashboard sections.
 *
 * `proxy.ts` only checks that *a* session cookie exists — it deliberately does
 * no crypto on every navigation. This is where the section is actually
 * enforced: the signature is verified and the role checked, so a provider
 * cannot sit on `/customer` looking at an empty shell, and nobody reaches
 * `/admin` without the admin flag.
 *
 * The API scopes its data independently, so this is about sending people
 * somewhere sensible rather than about keeping data safe — but a section a
 * user has no records for is a bug either way.
 */

const HOME: Record<Exclude<Role, "guest">, string> = {
  customer: "/customer",
  provider: "/provider",
  admin: "/admin",
};

export async function requireRole(role: Exclude<Role, "guest">) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(HOME[role])}`);
  }

  if (!session.roles.includes(role)) {
    // Send them to a section they can actually use rather than 403-ing —
    // this is a navigation mistake, not an attack.
    const fallback = session.roles.find((r) => r !== "guest") as
      | Exclude<Role, "guest">
      | undefined;
    redirect(fallback ? HOME[fallback] : "/login");
  }

  return session;
}

/**
 * The mirror of `requireRole`: keeps a signed-in person off the auth pages.
 *
 * Without this, `/login` renders its form to someone who is already signed in
 * — because nothing on the page ever asked. That happens more often than it
 * sounds: the header logo, a bookmark, the browser's back button after a
 * redirect, or any bounce through `/login?next=…` all land here with a valid
 * session, and the user is shown a form asking them to sign in again.
 *
 * `next` is honoured only when it points at a section this session can
 * actually use. An open redirect here would be a genuine hole: an attacker
 * could send `/login?next=https://evil.example` to a signed-in user and have
 * the app itself bounce them off-site. Requiring a leading single slash and
 * matching against the session's own roles closes both that and the subtler
 * `//evil.example` protocol-relative form.
 */
export async function redirectIfAuthenticated(next?: string) {
  const session = await getSession();
  if (!session) return;

  const allowed = session.roles
    .filter((r): r is Exclude<Role, "guest"> => r !== "guest")
    .map((r) => HOME[r]);

  const isSafe =
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    allowed.some((home) => next === home || next.startsWith(`${home}/`));

  redirect(isSafe ? next : homeForRoles(session.roles));
}

/** Resolves where a session should land by default. */
export function homeForRoles(roles: Role[]): string {
  if (roles.includes("customer")) return HOME.customer;
  if (roles.includes("provider")) return HOME.provider;
  if (roles.includes("admin")) return HOME.admin;
  return "/login";
}
