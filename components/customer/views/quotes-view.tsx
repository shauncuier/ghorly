"use client";

import { ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app-shell/app-shell";
import { QuoteCard } from "@/components/domain/quote-card";
import { ListSkeleton } from "@/components/skeletons";
import { useCustomerQuotes } from "@/lib/api/queries";
import { formatCount } from "@/lib/format";
import { EMPTY } from "@/lib/strings";
import type { QuoteStatus } from "@/lib/types";

const TABS: { value: string; label: string; match: QuoteStatus[] }[] = [
  { value: "new", label: "নতুন", match: ["sent"] },
  { value: "accepted", label: "গৃহীত", match: ["accepted"] },
  { value: "closed", label: "বন্ধ", match: ["declined", "withdrawn"] },
];

export function QuotesView() {
  const { data: quotes, isLoading, error, refetch } = useCustomerQuotes();
  const all = quotes ?? [];

  return (
    <>
      <PageHeader
        title="কোটেশন"
        description="পেশাদাররা আপনার অনুরোধে যে দাম ও সময় জানিয়েছেন।"
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <Tabs defaultValue="new">
          <TabsList className="mb-6">
            {TABS.map((tab) => {
              const count = all.filter((q) => tab.match.includes(q.status)).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="tabular text-fg-tertiary">({formatCount(count)})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((tab) => {
            const rows = all.filter((q) => tab.match.includes(q.status));
            return (
              <TabsContent key={tab.value} value={tab.value}>
                {rows.length === 0 ? (
                  <div className="rounded-lg border border-border bg-surface">
                    <EmptyState {...EMPTY.quotes} icon={<ReceiptText />} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {rows.map((quote) => (
                      <QuoteCard key={quote._id} quote={quote} />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </>
  );
}
