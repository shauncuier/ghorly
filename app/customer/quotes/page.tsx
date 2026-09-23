import type { Metadata } from "next";
import { QuotesView } from "@/components/customer/views/quotes-view";

export const metadata: Metadata = {
  title: "কোটেশন",
  robots: { index: false },
};

export default function Page() {
  return <QuotesView />;
}
