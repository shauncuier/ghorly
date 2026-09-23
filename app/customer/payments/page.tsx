import type { Metadata } from "next";
import { PaymentsView } from "@/components/customer/views/simple-views";

export const metadata: Metadata = {
  title: "পেমেন্ট",
  robots: { index: false },
};

export default function Page() {
  return <PaymentsView />;
}
