"use client";

import { useEffect, useState } from "react";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/format";

/**
 * A timestamp rendered relative to *now*.
 *
 * The frozen clock in `lib/data/clock.ts` exists so seed data is deterministic
 * and hydration-safe. Real records need the real time — but rendering
 * `Date.now()` during SSR produces different HTML than the browser does a
 * moment later, which is exactly the hydration mismatch the frozen clock was
 * protecting against.
 *
 * So: the server (and the first client render) emit the absolute date, which
 * both sides agree on. After mount, this swaps to the relative phrasing. The
 * full timestamp stays in `title` and `dateTime` either way, so the precise
 * value is always available to a reader or a screen reader.
 */
export function RelativeTime({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      // Same naive-local string shape the rest of the app uses.
      setNow(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      );
    };
    tick();
    // A minute is fine: nothing here is finer-grained than "৫ মিনিট আগে".
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time dateTime={value} title={formatDateTime(value, "long")} className={className}>
      {now ? formatRelativeTime(value, now) : formatDate(value, "medium")}
    </time>
  );
}
