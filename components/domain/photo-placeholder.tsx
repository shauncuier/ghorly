import { cn } from "@/lib/cn";
import { hashId } from "@/lib/format";
import { CategoryGlyph } from "@/components/domain/category-icon";
import { CATEGORY_BY_ID } from "@/lib/data/categories";

const SHADES = [
  "bg-ink-100",
  "bg-teal-50",
  "bg-ink-50",
  "bg-teal-100/60",
  "bg-ink-100/70",
  "bg-surface-muted",
] as const;

/**
 * Stands in for a portfolio or job photo.
 *
 * The shade varies by id so a portfolio grid isn't a flat monotone block, and
 * the category glyph at low opacity tells you what the missing photo would
 * have shown. Deterministic hash, so server and client agree.
 */
export function PhotoPlaceholder({
  id,
  categoryId,
  caption,
  aspect = "4/3",
  className,
}: {
  id: string;
  categoryId: string;
  caption?: string;
  aspect?: "4/3" | "1/1" | "16/9";
  className?: string;
}) {
  const category = CATEGORY_BY_ID[categoryId];
  const shade = SHADES[hashId(id) % SHADES.length];

  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "relative grid w-full place-items-center overflow-hidden rounded-lg border border-border-subtle",
          shade,
          aspect === "4/3" && "aspect-4/3",
          aspect === "1/1" && "aspect-square",
          aspect === "16/9" && "aspect-video",
        )}
      >
        {category && (
          <CategoryGlyph
            icon={category.icon}
            className="size-10 text-ink-950 opacity-10"
          />
        )}
      </div>
      {caption && (
        <figcaption className="text-xs text-fg-tertiary">{caption}</figcaption>
      )}
    </figure>
  );
}
