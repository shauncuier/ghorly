"use client";

import { AppShell } from "@/components/app-shell/app-shell";
import { NAV } from "@/lib/strings";

/**
 * No bottom bar: the admin surface is a desk tool. On a phone it collapses to
 * the drawer nav rather than pretending thirteen sections fit in a tab bar.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      nav={NAV.admin}
      role="admin"
      userName="প্রশাসক"
      userId="adm-0001"
      homeHref="/admin"
    >
      {children}
    </AppShell>
  );
}
