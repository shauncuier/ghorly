"use client";

import { Avatar as RadixAvatar } from "radix-ui";
import { cn } from "@/lib/cn";
import { firstGrapheme, hashId } from "@/lib/format";

/**
 * There is no backend and no photo store, so avatars are *generated*, never
 * fetched: the first Bangla grapheme of the name on a tint derived from a
 * stable hash of the entity id.
 *
 * Deterministic on purpose — a `Math.random()` tint would pick a different
 * colour on the server than in the browser and trip a hydration mismatch on
 * every card in the app.
 */

const TINTS = [
  "bg-teal-100 text-teal-800",
  "bg-ink-200 text-ink-800",
  "bg-teal-50 text-teal-700",
  "bg-ink-100 text-ink-700",
  "bg-teal-200 text-teal-900",
  "bg-ink-800 text-ink-50",
] as const;

const SIZES = {
  xs: "size-7 text-xs",
  sm: "size-9 text-sm",
  md: "size-11 text-base",
  lg: "size-14 text-xl",
  xl: "size-20 text-3xl",
  "2xl": "size-28 text-4xl",
} as const;

export interface AvatarProps {
  /** Bangla name — the first grapheme becomes the fallback initial. */
  name: string;
  /** Entity id, used to pick a stable tint. */
  id: string;
  src?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, id, src, size = "md", className }: AvatarProps) {
  const tint = TINTS[hashId(id) % TINTS.length];

  return (
    <RadixAvatar.Root
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        SIZES[size],
        className,
      )}
    >
      {src && (
        <RadixAvatar.Image
          src={src}
          alt=""
          className="size-full object-cover"
        />
      )}
      <RadixAvatar.Fallback
        delayMs={src ? 200 : 0}
        className={cn("grid size-full place-items-center font-semibold", tint)}
      >
        {/* The glyph is decorative — the name is always rendered as text nearby. */}
        <span aria-hidden="true" className="-translate-y-px">
          {firstGrapheme(name)}
        </span>
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

/** Overlapping stack, for "৫ জন পেশাদার সাড়া দিয়েছেন" style rows. */
export function AvatarGroup({
  people,
  max = 4,
  size = "sm",
  className,
}: {
  people: { id: string; name: string }[];
  max?: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((p) => (
        <Avatar
          key={p.id}
          id={p.id}
          name={p.name}
          size={size}
          className="ring-2 ring-surface"
        />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "grid place-items-center rounded-full bg-ink-100 font-medium text-fg-secondary ring-2 ring-surface",
            SIZES[size],
          )}
        >
          <span className="-translate-y-px text-xs">+{rest}</span>
        </span>
      )}
    </div>
  );
}
