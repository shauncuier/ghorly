"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app-shell/app-shell";
import { RequestCard } from "@/components/domain/request-card";
import { ListSkeleton } from "@/components/skeletons";
import { useCustomerRequests } from "@/lib/api/queries";
import { formatCount } from "@/lib/format";
import { ACTIONS, EMPTY } from "@/lib/strings";
import type { RequestStatus } from "@/lib/types";

const TABS: { value: string; label: string; match: RequestStatus[] }[] = [
  { value: "active", label: "চলমান", match: ["open", "quoted"] },
  { value: "booked", label: "বুক হয়েছে", match: ["booked"] },
  { value: "closed", label: "বন্ধ", match: ["cancelled", "expired"] },
];

export function RequestsView() {
  const { data: requests, isLoading, error, refetch } = useCustomerRequests();
  const all = requests ?? [];

  return (
    <>
      <PageHeader
        title="আমার অনুরোধ"
        description="আপনার পাঠানো সেবার অনুরোধ ও তাদের অবস্থা।"
        action={
          <Button asChild>
            <Link href="/customer/request">
              <Plus aria-hidden="true" />
              {ACTIONS.requestService}
            </Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListSkeleton count={4} />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            {TABS.map((tab) => {
              const count = all.filter((r) => tab.match.includes(r.status)).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="tabular text-fg-tertiary">({formatCount(count)})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((tab) => {
            const rows = all.filter((r) => tab.match.includes(r.status));
            return (
              <TabsContent key={tab.value} value={tab.value}>
                {rows.length === 0 ? (
                  <div className="rounded-lg border border-border bg-surface">
                    <EmptyState {...EMPTY.requests} icon={<FileText />} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {rows.map((request) => (
                      <RequestCard
                        key={request._id}
                        request={request}
                        perspective="customer"
                      />
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
