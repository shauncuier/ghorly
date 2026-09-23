import type { Metadata } from "next";
import { RequestDetailView } from "@/components/customer/views/request-detail-view";

export const metadata: Metadata = {
  title: "অনুরোধের বিস্তারিত",
  robots: { index: false },
};

export default async function Page({ params }: PageProps<"/customer/requests/[id]">) {
  const { id } = await params;
  return <RequestDetailView requestId={id} />;
}
