import type { Metadata } from "next";
import { ProviderServicesView } from "@/components/provider/views/business-views";

export const metadata: Metadata = {
  title: "আমার সেবা",
  robots: { index: false },
};

export default function Page() {
  return <ProviderServicesView />;
}
