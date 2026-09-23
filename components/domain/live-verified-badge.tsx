"use client";

import { VerifiedBadge } from "@/components/domain/verified-badge";
import { useProviderById } from "@/lib/api/queries";

/**
 * The verified badge, read from live store state instead of the build-time seed.
 *
 * Public provider pages are statically generated from `lib/data/` for SEO, so
 * a server-rendered badge would keep showing the seed value forever — and the
 * demo's best moment is approving a verification in the admin app and seeing
 * যাচাইকৃত appear on that provider's public profile.
 *
 * This keeps the page static and makes just the badge live. `fallback` is the
 * build-time value, so the server HTML and the first client render agree; the
 * store only diverges after `HYDRATE` runs post-mount, which React treats as
 * an ordinary update rather than a hydration mismatch.
 */
export function LiveVerifiedBadge({
  providerId,
  fallback,
  size = "md",
  showLabel = true,
}: {
  providerId: string;
  fallback: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const { data: provider } = useProviderById(providerId);
  const isVerified = provider?.isVerified ?? fallback;

  if (!isVerified) return null;
  return <VerifiedBadge size={size} showLabel={showLabel} />;
}
