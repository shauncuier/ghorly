"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/marketing/logo";
import { NavIcon } from "@/components/app-shell/nav-icon";
import { DataSourceBadge } from "@/components/app-shell/data-source-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useMutations } from "@/lib/api/mutations";
import { useServerSession, useUnreadCount } from "@/lib/api/queries";
import { formatPhone, toBn } from "@/lib/format";
import { ACTIONS, ARIA, ROLE_BN, type NavItem } from "@/lib/strings";
import type { Role } from "@/lib/types";

export interface ShellProps {
  children: React.ReactNode;
  nav: readonly NavItem[];
  mobileNav?: readonly NavItem[];
  role: Exclude<Role, "guest">;
  /** Display name shown in the top bar. */
  userName: string;
  userId: string;
  /** Route that counts as "home" for exact-match highlighting. */
  homeHref: string;
}

/**
 * One shell, three apps.
 *
 * Customer, provider and admin differ in their nav config, accent treatment
 * and whether they get a bottom bar — not in structure. Keeping it one
 * component means a fix to focus handling or the mobile drawer lands
 * everywhere at once.
 */
export function AppShell({
  children,
  nav,
  mobileNav,
  role,
  userName,
  userId,
  homeHref,
}: ShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = useUnreadCount();
  const session = useServerSession();
  const { switchRole, signOut } = useMutations();
  // Only roles this account actually holds — the server refuses the rest, so
  // offering them would just produce errors.
  const availableRoles = (session?.roles ?? []).filter(
    (r): r is Exclude<Role, "guest"> => r !== "guest",
  );

  function isActive(href: string) {
    return href === homeHref ? pathname === href : pathname.startsWith(href);
  }

  const navList = (onNavigate?: () => void) => (
    <ul className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                "transition-[background-color,color] duration-(--duration-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                active
                  ? "bg-teal-50 text-teal-800"
                  : "text-fg-secondary hover:bg-ink-100 hover:text-fg",
                "[&_svg]:size-4.5 [&_svg]:shrink-0",
              )}
            >
              <NavIcon name={item.icon} />
              <span className="-translate-y-px">{item.label}</span>
              {item.href.endsWith("/messages") && unread > 0 && (
                <Badge tone="danger" size="sm" className="ms-auto tabular">
                  {toBn(unread)}
                </Badge>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
            <DrawerTrigger asChild>
              <button
                type="button"
                aria-label={ARIA.openMenu}
                className="grid size-10 place-items-center rounded-md text-fg transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus lg:hidden"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </DrawerTrigger>
            <DrawerContent side="left">
              <div className="border-b border-border-subtle px-5 py-4">
                <Logo size="sm" href={homeHref} />
              </div>
              <nav aria-label={ARIA.sidebarNav} className="flex-1 overflow-y-auto px-3 py-4">
                {navList(() => setMobileOpen(false))}
              </nav>
            </DrawerContent>
          </Drawer>

          <div className="hidden w-60 shrink-0 lg:block">
            <Logo href={homeHref} />
          </div>

          <div className="lg:hidden">
            <Logo size="sm" href={homeHref} />
          </div>

          <div className="ms-auto flex items-center gap-1.5">
            <DataSourceBadge className="hidden md:inline-flex" />
            <Badge tone="neutral" variant="outline" className="hidden sm:inline-flex">
              {ROLE_BN[role]}
            </Badge>

            <Link
              href={`${homeHref}/messages`}
              aria-label={`${ARIA.notifications}${unread > 0 ? ` — ${toBn(unread)}টি নতুন` : ""}`}
              className="relative grid size-10 place-items-center rounded-md text-fg-secondary transition-colors hover:bg-ink-100 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
              <Bell className="size-5" aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-danger-500 ring-2 ring-surface" />
              )}
            </Link>

            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  aria-label={ARIA.userMenu}
                  className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                  <Avatar id={userId} name={userName} size="sm" />
                  <span className="hidden max-w-32 truncate-bn text-sm font-medium text-fg md:block">
                    {userName}
                  </span>
                </button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>
                  {session?.phone ? formatPhone(session.phone) : "অ্যাকাউন্ট"}
                </DropdownLabel>

                {availableRoles.length > 1 && (
                  <>
                    <DropdownSeparator />
                    <DropdownLabel>ভূমিকা বদলান</DropdownLabel>
                    {availableRoles.map((r) => (
                      <DropdownItem
                        key={r}
                        onSelect={() => {
                          void switchRole(r);
                        }}
                      >
                        <User />
                        {ROLE_BN[r]}
                        {r === role && (
                          <span className="ms-auto text-xs text-fg-tertiary">বর্তমান</span>
                        )}
                      </DropdownItem>
                    ))}
                  </>
                )}

                <DropdownSeparator />
                <DropdownItem
                  danger
                  onSelect={() => {
                    void signOut();
                  }}
                >
                  <LogOut />
                  {ACTIONS.logout}
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ---------- sidebar ---------- */}
        <aside className="hidden w-60 shrink-0 border-e border-border bg-surface lg:block">
          <nav
            aria-label={ARIA.sidebarNav}
            className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-3"
          >
            {navList()}
          </nav>
        </aside>

        {/* ---------- content ---------- */}
        <main
          id="main"
          className={cn(
            "min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8",
            mobileNav && "pb-(--spacing-bottomnav) lg:pb-8",
          )}
        >
          <div className="container-dashboard">{children}</div>
        </main>
      </div>

      {/* ---------- mobile bottom bar ---------- */}
      {mobileNav && (
        <nav
          aria-label={ARIA.bottomNav}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
        >
          <ul className="flex items-stretch">
            {mobileNav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-xs",
                      "transition-colors duration-(--duration-fast)",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-focus",
                      active ? "text-teal-700" : "text-fg-tertiary",
                      "[&_svg]:size-5",
                    )}
                  >
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

/** Page title block shared by every dashboard route. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-fg md:text-3xl">{title}</h1>
        {description && <p className="text-base text-fg-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { Button };
