import type { Metadata } from "next";
import { AdminReportsView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "রিপোর্ট",
  robots: { index: false },
};

export default function Page() {
  return <AdminReportsView />;
}
