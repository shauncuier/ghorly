"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store/context";

/**
 * The single `'use client'` boundary the server root layout imports.
 *
 * `StoreProvider` sits in the **root** layout deliberately: App Router does not
 * remount root layouts on client navigation, so mock state survives every
 * navigation in the app for free. Accept a request in the provider dashboard,
 * navigate to the customer side, and the new quote is already there.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={200} skipDelayDuration={400}>
        {children}
      </TooltipProvider>
    </StoreProvider>
  );
}
