import type { Metadata } from "next";
import { AdminVerificationView } from "@/components/admin/views/people-views";

export const metadata: Metadata = {
  title: "যাচাইকরণ",
  robots: { index: false },
};

export default function Page() {
  return <AdminVerificationView />;
}
