import type { Metadata } from "next";
import { AdminSettingsView } from "@/components/admin/views/ops-views";

export const metadata: Metadata = {
  title: "সেটিংস",
  robots: { index: false },
};

export default function Page() {
  return <AdminSettingsView />;
}
