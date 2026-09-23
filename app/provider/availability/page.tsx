import type { Metadata } from "next";
import { ProviderAvailabilityView } from "@/components/provider/views/business-views";

export const metadata: Metadata = {
  title: "সময়সূচি",
  robots: { index: false },
};

export default function Page() {
  return <ProviderAvailabilityView />;
}
