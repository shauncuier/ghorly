import type { Metadata } from "next";
import { MessagesView } from "@/components/customer/views/messages-view";

export const metadata: Metadata = {
  title: "বার্তা",
  robots: { index: false },
};

export default function Page() {
  return <MessagesView as="provider" />;
}
