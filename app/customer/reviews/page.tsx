import type { Metadata } from "next";
import { ReviewsView } from "@/components/customer/views/simple-views";

export const metadata: Metadata = {
  title: "আমার রিভিউ",
  robots: { index: false },
};

export default function Page() {
  return <ReviewsView />;
}
