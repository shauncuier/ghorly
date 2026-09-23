import { redirect } from "next/navigation";

/**
 * Retired: customers no longer pick providers — the Ghorly team assigns one.
 * Kept as a redirect so old links and bookmarks still land somewhere useful.
 */
export default function Page() {
  redirect("/customer/request");
}
