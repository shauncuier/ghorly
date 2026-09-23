"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";
import { ACTIONS, ARIA, NAV } from "@/lib/strings";

/**
 * The only client island in the marketing header.
 *
 * Keeping the disclosure state here means the header itself — logo, desktop
 * nav, CTAs — stays server-rendered HTML, which is what keeps the landing
 * page's JS small and its markup indexable.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={ARIA.openMenu}
          className="grid size-10 place-items-center rounded-md text-fg transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </DrawerTrigger>

      <DrawerContent side="right" className="w-[min(20rem,calc(100vw-3rem))]">
        <div className="border-b border-border-subtle px-5 py-4">
          <Logo size="sm" />
        </div>

        <nav aria-label={ARIA.mainNav} className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {NAV.marketing.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium text-fg transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-2.5 border-t border-border-subtle px-5 py-5">
          <Button asChild block>
            <Link href="/customer/request" onClick={() => setOpen(false)}>
              {ACTIONS.getStarted}
            </Link>
          </Button>
          <Button asChild variant="secondary" block>
            <Link href="/register/provider" onClick={() => setOpen(false)}>
              {ACTIONS.becomeProfessional}
            </Link>
          </Button>
          <Button asChild variant="ghost" block>
            <Link href="/login" onClick={() => setOpen(false)}>
              {ACTIONS.login}
            </Link>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
