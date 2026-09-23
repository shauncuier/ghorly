"use client";

import { AppShell } from "@/components/app-shell/app-shell";
import { useCurrentCustomer } from "@/lib/api/queries";
import { NAV } from "@/lib/strings";

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const { data: customer } = useCurrentCustomer();

  return (
    <AppShell
      nav={NAV.customer}
      mobileNav={NAV.customerMobile}
      role="customer"
      userName={customer?.bnName ?? "গ্রাহক"}
      userId={customer?._id ?? "cus-0001"}
      homeHref="/customer"
    >
      {children}
    </AppShell>
  );
}
