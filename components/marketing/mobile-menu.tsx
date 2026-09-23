"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { HeaderAuthActions } from "@/components/marketing/header-auth";
import { Logo } from "@/components/marketing/logo";
import { ARIA, NAV } from "@/lib/strings";

/**
 * The marketing header's mobile drawer (a client island, like the account
 * buttons in `header-auth.tsx`).
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
          <HeaderAuthActions layout="menu" onNavigate={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
