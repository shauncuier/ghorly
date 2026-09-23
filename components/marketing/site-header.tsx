import Link from "next/link";
import { Logo } from "@/components/marketing/logo";
import { MobileMenu } from "@/components/marketing/mobile-menu";
import { HeaderAuthActions } from "@/components/marketing/header-auth";
import { ARIA, NAV } from "@/lib/strings";

/**
 * Server component. The sticky background transition is pure CSS —
 * `backdrop-blur` plus a translucent surface — rather than a scroll listener,
 * so the header itself needs no `'use client'`. Only the account buttons are
 * an island, because they depend on who is signed in.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo />

          <nav aria-label={ARIA.mainNav} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.marketing.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-ink-100 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Client island: swaps to "dashboard" once the session is known. */}
          <HeaderAuthActions layout="bar" />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
