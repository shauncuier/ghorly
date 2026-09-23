import { Suspense } from "react";
import type { Metadata } from "next";
import { ServicesView } from "@/components/customer/views/services-view";
import { ProviderGridSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "সেবা খুঁজুন",
  robots: { index: false },
};

/** `ServicesView` reads `useSearchParams`, so it needs a Suspense boundary. */
export default function CustomerServicesPage() {
  return (
    <Suspense fallback={<ProviderGridSkeleton count={6} />}>
      <ServicesView />
    </Suspense>
  );
}
