import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * Server component, and it stays that way.
 *
 * No `'use client'` appears anywhere under `app/(marketing)` — interactivity
 * enters only through named islands (the mobile menu, the hero search, the
 * area map). That is what keeps the marketing pages server-rendered HTML for
 * SEO and keeps the landing bundle small.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
