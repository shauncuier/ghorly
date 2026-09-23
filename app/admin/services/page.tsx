import type { Metadata } from "next";
import { AdminServicesView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "সেবা",
  robots: { index: false },
};

export default function Page() {
  return <AdminServicesView />;
}
