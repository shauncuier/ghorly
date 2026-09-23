import type { Metadata } from "next";
import { AdminReviewsView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "রিভিউ",
  robots: { index: false },
};

export default function Page() {
  return <AdminReviewsView />;
}
