import type { Metadata } from "next";
import { ProviderCalendarView } from "@/components/provider/views/business-views";

export const metadata: Metadata = {
  title: "ক্যালেন্ডার",
  robots: { index: false },
};

export default function Page() {
  return <ProviderCalendarView />;
}
