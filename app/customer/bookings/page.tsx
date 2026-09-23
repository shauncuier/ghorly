import type { Metadata } from "next";
import { BookingsView } from "@/components/customer/views/bookings-view";

export const metadata: Metadata = {
  title: "আমার বুকিং",
  robots: { index: false },
};

export default function Page() {
  return <BookingsView />;
}
