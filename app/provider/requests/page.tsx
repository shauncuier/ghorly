import type { Metadata } from "next";
import { ProviderRequestsView } from "@/components/provider/views/work-views";

export const metadata: Metadata = {
  title: "নতুন অনুরোধ",
  robots: { index: false },
};

export default function Page() {
  return <ProviderRequestsView />;
}
