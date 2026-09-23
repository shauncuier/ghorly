import type { Metadata } from "next";
import { ProviderEarningsView } from "@/components/provider/views/business-views";

export const metadata: Metadata = {
  title: "আয়",
  robots: { index: false },
};

export default function Page() {
  return <ProviderEarningsView />;
}
