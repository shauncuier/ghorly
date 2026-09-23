import type { Metadata } from "next";
import { AdminProvidersView } from "@/components/admin/views/people-views";

export const metadata: Metadata = {
  title: "পেশাদার",
  robots: { index: false },
};

export default function Page() {
  return <AdminProvidersView />;
}
