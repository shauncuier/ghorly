import type { Metadata } from "next";
import { BookingDetailView } from "@/components/customer/views/booking-detail-view";

export const metadata: Metadata = {
  title: "বুকিংয়ের বিস্তারিত",
  robots: { index: false },
};

export default async function Page({ params }: PageProps<"/customer/bookings/[id]">) {
  const { id } = await params;
  return <BookingDetailView bookingId={id} />;
}
