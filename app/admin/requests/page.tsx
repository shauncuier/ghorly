import type { Metadata } from "next";
import { AdminRequestsView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "অনুরোধ",
  robots: { index: false },
};

export default function Page() {
  return <AdminRequestsView />;
}
