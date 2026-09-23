import type { Metadata } from "next";
import { AdminDisputesView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "বিরোধ",
  robots: { index: false },
};

export default function Page() {
  return <AdminDisputesView />;
}
