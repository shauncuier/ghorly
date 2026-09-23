import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin/views/dashboard-view";

export const metadata: Metadata = {
  title: "ড্যাশবোর্ড",
  robots: { index: false },
};

export default function Page() {
  return <AdminDashboardView />;
}
