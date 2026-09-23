"use client";

import { AppShell } from "@/components/app-shell/app-shell";
import { useCurrentProvider } from "@/lib/api/queries";
import { NAV } from "@/lib/strings";

export function ProviderShell({ children }: { children: React.ReactNode }) {
  const { data: provider } = useCurrentProvider();

  return (
    <AppShell
      nav={NAV.provider}
      mobileNav={NAV.providerMobile}
      role="provider"
      userName={provider?.bnName ?? "পেশাদার"}
      userId={provider?._id ?? "prv-0001"}
      homeHref="/provider"
    >
      {children}
    </AppShell>
  );
}
