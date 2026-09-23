import type { Metadata } from "next";
import { AdminBookingsView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "বুকিং",
  robots: { index: false },
};

export default function Page() {
  return <AdminBookingsView />;
}
