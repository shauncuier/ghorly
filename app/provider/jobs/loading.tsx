import { BookingCardSkeleton } from "@/components/skeletons";

/** Shown while the route segment streams in. */
export default function Loading() {
  return <div className="flex flex-col gap-4"><BookingCardSkeleton /><BookingCardSkeleton /></div>;
}
