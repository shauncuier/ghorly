"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useIsFavorite } from "@/lib/api/queries";
import { useMutations } from "@/lib/api/mutations";
import { ARIA } from "@/lib/strings";

/**
 * Reads through `lib/api/queries` and writes through `lib/api/mutations` —
 * never touching the store directly. Small, but it is the pattern every
 * interactive component in the app follows.
 */
export function FavoriteButton({
  providerId,
  providerName,
  size = "md",
  className,
}: {
  providerId: string;
  providerName: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const isFavorite = useIsFavorite(providerId);
  const { toggleFavorite } = useMutations();
  const [pending, setPending] = useState(false);

  async function onClick(e: React.MouseEvent) {
    // The card behind this is a link; don't follow it.
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    try {
      await toggleFavorite(providerId, providerName);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? ARIA.removeFromFavorites : ARIA.addToFavorites}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border bg-surface/90 backdrop-blur-sm",
        "transition-[border-color,background-color,color,transform] duration-(--duration-fast)",
        "hover:scale-105 active:scale-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        "disabled:opacity-60",
        isFavorite
          ? "border-danger-200 text-danger-600"
          : "border-border text-fg-tertiary hover:text-fg",
        size === "sm" ? "size-8" : "size-9",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(size === "sm" ? "size-4" : "size-4.5", isFavorite && "fill-current")}
      />
    </button>
  );
}
