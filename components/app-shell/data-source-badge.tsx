"use client";

import { Database, DatabaseZap, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDataSource } from "@/lib/api/queries";
import { SimpleTooltip } from "@/components/ui/tooltip";

/**
 * Shows whether the screen is backed by MongoDB or by the in-memory seed.
 *
 * Worth surfacing rather than hiding: in a demo it is the difference between
 * "this wrote to a database" and "this is a mock", and when the connection
 * drops mid-presentation the badge explains why changes stopped persisting.
 */
export function DataSourceBadge({ className }: { className?: string }) {
  const source = useDataSource();

  const config = {
    loading: {
      icon: Loader2,
      label: "সংযোগ হচ্ছে",
      tip: "ডেটাবেসের সাথে সংযোগ করা হচ্ছে…",
      classes: "border-border bg-surface text-fg-tertiary",
      spin: true,
    },
    database: {
      icon: DatabaseZap,
      label: "ডেটাবেস",
      tip: "MongoDB-তে সংযুক্ত — সব পরিবর্তন সংরক্ষিত হচ্ছে।",
      classes: "border-success-500/30 bg-success-50 text-success-700",
      spin: false,
    },
    offline: {
      icon: Database,
      label: "ডেমো মোড",
      tip: "ডেটাবেস পাওয়া যায়নি — নমুনা ডেটা দিয়ে চলছে, পরিবর্তন সংরক্ষিত হবে না।",
      classes: "border-warning-500/30 bg-warning-50 text-warning-700",
      spin: false,
    },
  }[source];

  const Icon = config.icon;

  return (
    <SimpleTooltip label={config.tip} side="bottom">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          config.classes,
          className,
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn("size-3.5 shrink-0", config.spin && "animate-spin")}
        />
        <span className="-translate-y-px">{config.label}</span>
      </span>
    </SimpleTooltip>
  );
}
