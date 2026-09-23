import type { Metadata } from "next";
import { ProviderReviewsView } from "@/components/provider/views/work-views";

export const metadata: Metadata = {
  title: "রিভিউ",
  robots: { index: false },
};

export default function Page() {
  return <ProviderReviewsView />;
}
