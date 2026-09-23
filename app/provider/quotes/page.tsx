import type { Metadata } from "next";
import { ProviderQuotesView } from "@/components/provider/views/work-views";

export const metadata: Metadata = {
  title: "কোটেশন",
  robots: { index: false },
};

export default function Page() {
  return <ProviderQuotesView />;
}
