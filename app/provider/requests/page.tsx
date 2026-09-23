import { redirect } from "next/navigation";

/**
 * Retired: providers no longer browse an open request feed — the team assigns jobs.
 * Kept as a redirect so old links and bookmarks still land somewhere useful.
 */
export default function Page() {
  redirect("/provider/jobs");
}
