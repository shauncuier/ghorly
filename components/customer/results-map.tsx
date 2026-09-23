"use client";

import { cn } from "@/lib/cn";
import { ProviderCardCompact } from "@/components/domain/provider-card";
import { useAreas } from "@/lib/api/queries";
import { formatCount } from "@/lib/format";
import type { Provider } from "@/lib/types";

/**
 * Map view for the marketplace.
 *
 * Same approach as the marketing map and for the same reasons — a decorative
 * `aria-hidden` SVG with real `<button>` hotspots positioned over it, so the
 * area picker keeps native focus rings and keyboard order. Dot size scales
 * with how many of the *current results* fall in that area, so the map
 * reflects the active filters rather than static totals.
 */
export function ResultsMap({
  providers,
  activeAreaId,
  onAreaSelect,
}: {
  providers: Provider[];
  activeAreaId: string | null;
  onAreaSelect: (areaId: string | null) => void;
}) {
  const { data: areas } = useAreas();

  const counts = new Map<string, number>();
  for (const p of providers) {
    counts.set(p.areaId, (counts.get(p.areaId) ?? 0) + 1);
  }

  const visible = (areas ?? []).filter((a) => (counts.get(a._id) ?? 0) > 0);
  const maxCount = Math.max(1, ...visible.map((a) => counts.get(a._id) ?? 0));

  const shown = activeAreaId
    ? providers.filter((p) => p.areaId === activeAreaId)
    : providers;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-border bg-surface p-4">
        <svg viewBox="0 0 100 75" aria-hidden="true" className="size-full">
          <path
            d="M14 18 L30 9 L48 7 L63 10 L74 16 L82 27 L86 40 L83 54 L74 66 L58 71 L40 70 L26 63 L16 50 L11 34 Z"
            fill="var(--ink-50)"
            stroke="var(--border)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          <path
            d="M22 68 C36 62, 48 60, 60 56 C70 52, 78 46, 92 38"
            fill="none"
            stroke="var(--teal-200)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>

        {visible.map((area) => {
          const count = counts.get(area._id) ?? 0;
          const on = activeAreaId === area._id;
          // 28px → 52px as the count approaches the busiest area.
          const size = 28 + Math.round((count / maxCount) * 24);

          return (
            <button
              key={area._id}
              type="button"
              aria-pressed={on}
              onClick={() => onAreaSelect(on ? null : area._id)}
              style={{
                left: `${area.mapX}%`,
                top: `${area.mapY}%`,
                width: size,
                height: size,
              }}
              className={cn(
                "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs font-semibold tabular",
                "transition-[background-color,border-color,color,box-shadow] duration-(--duration-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                on
                  ? "z-10 border-teal-700 bg-teal-600 text-white shadow-md"
                  : "border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-400",
              )}
            >
              <span className="-translate-y-px">{formatCount(count)}</span>
              <span className="sr-only">
                {area.bnName} — {formatCount(count, "পেশাদার")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex max-h-[32rem] flex-col gap-2.5 overflow-y-auto pe-1">
        {shown.map((provider) => (
          <ProviderCardCompact key={provider._id} provider={provider} />
        ))}
      </div>
    </div>
  );
}
