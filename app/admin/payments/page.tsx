import type { Metadata } from "next";
import { AdminPaymentsView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "পেমেন্ট",
  robots: { index: false },
};

export default function Page() {
  return <AdminPaymentsView />;
}
