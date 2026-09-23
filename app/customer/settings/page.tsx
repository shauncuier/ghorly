import type { Metadata } from "next";
import { CustomerSettingsView } from "@/components/customer/views/simple-views";

export const metadata: Metadata = {
  title: "সেটিংস",
  robots: { index: false },
};

export default function Page() {
  return <CustomerSettingsView />;
}
