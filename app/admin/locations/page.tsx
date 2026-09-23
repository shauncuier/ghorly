import type { Metadata } from "next";
import { AdminLocationsView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "এলাকা",
  robots: { index: false },
};

export default function Page() {
  return <AdminLocationsView />;
}
