import type { Metadata } from "next";
import { AddressesView } from "@/components/customer/views/simple-views";

export const metadata: Metadata = {
  title: "ঠিকানা",
  robots: { index: false },
};

export default function Page() {
  return <AddressesView />;
}
