import { Suspense } from "react";
import type { Metadata } from "next";
import { RequestWizard } from "@/components/customer/request-wizard/wizard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "সেবার অনুরোধ",
  robots: { index: false },
};

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <RequestWizard />
    </Suspense>
  );
}
