import type { Metadata } from "next";
import { BookingConfirmView } from "@/components/customer/views/booking-confirm-view";

export const metadata: Metadata = {
  title: "বুকিং নিশ্চিত করুন",
  robots: { index: false },
};

export default async function Page({
  params,
}: PageProps<"/customer/bookings/[id]/confirm">) {
  const { id } = await params;
  return <BookingConfirmView bookingId={id} />;
}
