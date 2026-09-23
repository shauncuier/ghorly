import type { Metadata } from "next";
import { RequestsView } from "@/components/customer/views/requests-view";

export const metadata: Metadata = {
  title: "আমার অনুরোধ",
  robots: { index: false },
};

export default function Page() {
  return <RequestsView />;
}
