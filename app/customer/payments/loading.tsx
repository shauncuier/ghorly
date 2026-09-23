import { ListSkeleton } from "@/components/skeletons";

/** Shown while the route segment streams in. */
export default function Loading() {
  return <ListSkeleton count={5} />;
}
