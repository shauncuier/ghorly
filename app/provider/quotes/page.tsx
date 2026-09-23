import { redirect } from "next/navigation";

/**
 * Retired: providers no longer send quotes — the team agrees the price with them.
 * Kept as a redirect so old links and bookmarks still land somewhere useful.
 */
export default function Page() {
  redirect("/provider/jobs");
}
