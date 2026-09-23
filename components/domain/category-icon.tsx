import {
  Bug,
  Cctv,
  Hammer,
  House,
  PaintRoller,
  Sofa,
  Sparkles,
  Sprout,
  Truck,
  WashingMachine,
  Wifi,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { IconKey } from "@/lib/types";

/**
 * Fourteen category "images" from one component and zero image files.
 *
 * With no backend there is nowhere to store category art, and stock
 * photography would read as filler. A lucide glyph on a tinted tile reads as a
 * deliberate design-system choice instead — and costs no network, no CLS and
 * no hydration risk.
 */

const ICONS: Record<IconKey, React.ElementType> = {
  wrench: Wrench,
  zap: Zap,
  wind: Wind,
  "washing-machine": WashingMachine,
  sparkles: Sparkles,
  "paint-roller": PaintRoller,
  hammer: Hammer,
  bug: Bug,
  cctv: Cctv,
  wifi: Wifi,
  truck: Truck,
  sofa: Sofa,
  sprout: Sprout,
  house: House,
};

/** Six desaturated ink/teal tints — deliberately not one hue per category. */
const TINTS = [
  "bg-teal-50 text-teal-700",
  "bg-ink-100 text-ink-700",
  "bg-teal-100/70 text-teal-800",
  "bg-ink-50 text-ink-600",
  "bg-teal-50 text-teal-600",
  "bg-ink-100/70 text-ink-600",
] as const;

const SIZES = {
  sm: "size-9 rounded-md [&_svg]:size-4.5",
  md: "size-11 rounded-lg [&_svg]:size-5",
  lg: "size-14 rounded-lg [&_svg]:size-6",
  xl: "size-16 rounded-xl [&_svg]:size-7",
} as const;

export function CategoryIcon({
  icon,
  tint = 0,
  size = "md",
  className,
}: {
  icon: IconKey;
  tint?: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? House;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center transition-colors duration-(--duration-base)",
        TINTS[tint % TINTS.length],
        SIZES[size],
        className,
      )}
    >
      <Icon strokeWidth={1.75} />
    </span>
  );
}

/** Bare glyph, for inline use in lists and table cells. */
export function CategoryGlyph({
  icon,
  className,
}: {
  icon: IconKey;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? House;
  return <Icon aria-hidden="true" strokeWidth={1.75} className={cn("size-4", className)} />;
}
