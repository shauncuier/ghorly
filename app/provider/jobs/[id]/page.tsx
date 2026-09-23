import type { Metadata } from "next";
import { ProviderJobDetailView } from "@/components/provider/views/job-detail-view";

export const metadata: Metadata = {
  title: "কাজের বিস্তারিত",
  robots: { index: false },
};

export default async function Page({ params }: PageProps<"/provider/jobs/[id]">) {
  const { id } = await params;
  return <ProviderJobDetailView bookingId={id} />;
}
