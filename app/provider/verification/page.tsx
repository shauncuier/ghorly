import type { Metadata } from "next";
import { ProviderVerificationView } from "@/components/provider/views/business-views";

export const metadata: Metadata = {
  title: "যাচাইকরণ",
  robots: { index: false },
};

export default function Page() {
  return <ProviderVerificationView />;
}
