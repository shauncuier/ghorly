import type { Metadata } from "next";
import { AdminCustomersView } from "@/components/admin/views/people-views";

export const metadata: Metadata = {
  title: "গ্রাহক",
  robots: { index: false },
};

export default function Page() {
  return <AdminCustomersView />;
}
