import type { Metadata } from "next";
import { ProviderJobsView } from "@/components/provider/views/work-views";

export const metadata: Metadata = {
  title: "কাজ",
  robots: { index: false },
};

export default function Page() {
  return <ProviderJobsView />;
}
