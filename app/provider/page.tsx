import type { Metadata } from "next";
import { ProviderDashboardView } from "@/components/provider/views/dashboard-view";

export const metadata: Metadata = {
  title: "ড্যাশবোর্ড",
  robots: { index: false },
};

export default function Page() {
  return <ProviderDashboardView />;
}
