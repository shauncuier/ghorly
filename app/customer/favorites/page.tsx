import type { Metadata } from "next";
import { FavoritesView } from "@/components/customer/views/simple-views";

export const metadata: Metadata = {
  title: "পছন্দের তালিকা",
  robots: { index: false },
};

export default function Page() {
  return <FavoritesView />;
}
