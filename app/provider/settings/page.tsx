import type { Metadata } from "next";
import { ProviderSettingsView } from "@/components/provider/views/business-views";

export const metadata: Metadata = {
  title: "সেটিংস",
  robots: { index: false },
};

export default function Page() {
  return <ProviderSettingsView />;
}
