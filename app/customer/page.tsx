import type { Metadata } from "next";
import { DashboardView } from "@/components/customer/views/dashboard-view";

export const metadata: Metadata = {
  title: "ড্যাশবোর্ড",
  robots: { index: false },
};

export default function CustomerDashboardPage() {
  return <DashboardView />;
}
