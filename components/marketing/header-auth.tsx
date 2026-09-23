"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerSession } from "@/lib/store/context";
import { useMutations } from "@/lib/api/mutations";
import { ACTIONS } from "@/lib/strings";

/** Where each role's app lives — mirrors `HOME` in lib/auth/guard.ts (server-only). */
const HOME = { customer: "/customer", provider: "/provider", admin: "/admin" } as const;

const DASHBOARD_LABEL = {
  customer: "আমার ড্যাশবোর্ড",
  provider: "পেশাদার ড্যাশবোর্ড",
  admin: "অ্যাডমিন প্যানেল",
} as const;

/**
 * The marketing header's account buttons.
 *
 * A client island on purpose: the marketing pages are statically rendered for
 * SEO, so the server can't know who is looking. The session the store already
 * fetched from `/api/bootstrap` decides instead — signed-out visitors get
 * login / join / get started; a signed-in person gets their dashboard, plus
 * an admin-panel button if (and only if) their account holds the admin role.
 *
 * Until bootstrap answers, the signed-out buttons show, which is also what the
 * static HTML contains, so there is no hydration mismatch.
 */
export function HeaderAuthActions({
  layout,
  onNavigate,
}: {
  layout: "bar" | "menu";
  onNavigate?: () => void;
}) {
  const session = useServerSession();
  const { switchRole } = useMutations();
  const [opening, setOpening] = useState(false);
  const bar = layout === "bar";

  if (session) {
    const role = session.activeRole;
    // Only for accounts that really hold admin (the server re-checks on the
    // switch). Hidden when already acting as admin — the dashboard button
    // below is then the admin panel.
    const canAdmin = session.roles.includes("admin") && role !== "admin";

    async function openAdmin() {
      setOpening(true);
      onNavigate?.();
      try {
        // Switch the active role first, then land on /admin (switchRole navigates).
        await switchRole("admin");
      } finally {
        setOpening(false);
      }
    }

    return (
      <>
        {canAdmin && (
          <Button
            variant="inverse"
            size={bar ? "sm" : undefined}
            block={!bar}
            loading={opening}
            onClick={() => void openAdmin()}
            className={bar ? "hidden sm:inline-flex" : undefined}
          >
            <ShieldCheck aria-hidden="true" />
            {DASHBOARD_LABEL.admin}
          </Button>
        )}
        <Button asChild size={bar ? "sm" : undefined} block={!bar} className={bar ? "hidden sm:inline-flex" : undefined}>
          <Link href={HOME[role]} onClick={onNavigate}>
            <LayoutDashboard aria-hidden="true" />
            {DASHBOARD_LABEL[role]}
          </Link>
        </Button>
        {role === "customer" && (
          <Button
            asChild
            variant="secondary"
            size={bar ? "sm" : undefined}
            block={!bar}
            className={bar ? "hidden lg:inline-flex" : undefined}
          >
            <Link href="/customer/request" onClick={onNavigate}>
              {ACTIONS.requestService}
            </Link>
          </Button>
        )}
      </>
    );
  }

  if (bar) {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/login">{ACTIONS.login}</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="hidden lg:inline-flex">
          <Link href="/register/provider">{ACTIONS.becomeProfessional}</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/customer/request">{ACTIONS.getStarted}</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <Button asChild block>
        <Link href="/customer/request" onClick={onNavigate}>
          {ACTIONS.getStarted}
        </Link>
      </Button>
      <Button asChild variant="secondary" block>
        <Link href="/register/provider" onClick={onNavigate}>
          {ACTIONS.becomeProfessional}
        </Link>
      </Button>
      <Button asChild variant="ghost" block>
        <Link href="/login" onClick={onNavigate}>
          {ACTIONS.login}
        </Link>
      </Button>
    </>
  );
}
