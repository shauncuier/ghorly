import { ProviderGridSkeleton } from "@/components/skeletons";

/** Shown while the route segment streams in. */
export default function Loading() {
  return <ProviderGridSkeleton count={6} />;
}
