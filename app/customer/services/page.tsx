import { redirect } from "next/navigation";

/**
 * Retired: customers no longer browse and pick providers — they describe the job and the team assigns one.
 * Kept as a redirect so old links and bookmarks still land somewhere useful.
 */
export default function Page() {
  redirect("/customer/request");
}
