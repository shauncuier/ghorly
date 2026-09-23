/**
 * The frozen clock.
 *
 * Every relative time, "today" highlight and seeded timestamp in the prototype
 * is anchored here. Nothing anywhere may call `Date.now()` or `new Date()` in a
 * render path — the server would compute from UTC and the client from
 * Asia/Dhaka, so "৩ ঘণ্টা আগে" would differ between the two and React would
 * report a hydration mismatch.
 *
 * Timestamps across the app are *naive local* strings, `YYYY-MM-DDTHH:mm`,
 * parsed by regex in `lib/format.ts` — never by the `Date` constructor.
 */

/**
 * The anchor is decided ONCE, at build time, and baked into both the server
 * and the client bundle by `next.config.ts` (`NEXT_PUBLIC_GHORLY_ANCHOR`).
 *
 * That gives both properties at once:
 *
 *  - **Deterministic.** It is a constant string inside a given build, so the
 *    server HTML and the first client render agree exactly. Reading the system
 *    clock here instead would compute from the server's timezone and the
 *    browser's, and "৩ ঘণ্টা আগে" would differ between them.
 *  - **Current.** It is *today* rather than a date frozen in the source, so
 *    the date pickers offer real upcoming days and the seed — which is written
 *    entirely as `shiftDays(TODAY, n)`, with no hard-coded dates anywhere —
 *    re-anchors itself every time you build or seed.
 *
 * Scripts run outside Next and never see the baked value, so they fall back to
 * computing the same thing from the real clock. Same day, same anchor.
 */
function defaultAnchor(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T10:00`;
}

/** The moment the prototype believes it is, for this build. */
export const NOW: string = process.env.NEXT_PUBLIC_GHORLY_ANCHOR || defaultAnchor();

/** Civil date parts of NOW, for seeding and for "today" comparisons. */
export const TODAY: string = NOW.slice(0, 10);
export const YESTERDAY: string = shiftDays(TODAY, -1);
export const TOMORROW: string = shiftDays(TODAY, 1);

/** Weekday index of TODAY: 0 = রবিবার, the start of the Bangladeshi work week. */
export const TODAY_WEEKDAY_INDEX: number = (() => {
  const [y, m, d] = TODAY.split("-").map(Number);
  // 1970-01-01 was a Thursday; +4 shifts so that Sunday === 0.
  return (((daysFromCivil(y, m, d) + 4) % 7) + 7) % 7;
})();

/**
 * Shift a naive-local date by whole days, without touching `Date`.
 * Used by seed data so anchors stay readable: `shiftDays(TODAY, -3)`.
 */
export function shiftDays(date: string, days: number): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const dayNumber = daysFromCivil(y, m, d) + days;
  return civilFromDays(dayNumber);
}

/** Days since 1970-01-01 for a civil date. Timezone-free by construction. */
export function daysFromCivil(y: number, m: number, d: number): number {
  const yAdj = y - (m <= 2 ? 1 : 0);
  const era = Math.floor(yAdj / 400);
  const yoe = yAdj - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Inverse of `daysFromCivil`, returning `YYYY-MM-DD`. */
export function civilFromDays(dayNumber: number): string {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  const year = y + (m <= 2 ? 1 : 0);
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ *
 * The real clock — write paths only.
 *
 * `NOW` above is the demo anchor: deterministic, shared by the server and the
 * first client render, and therefore the only thing safe to use while
 * rendering. The functions below read the actual system clock, so they must
 * never be called during render. They exist because a record a real person
 * creates has to carry the real time — stamping it with `NOW` made every live
 * request claim it was filed on ১৫ মার্চ.
 *
 * Safe call sites: reducer write cases (they run in event handlers and in the
 * `/api/mutate` route, never during render) and scripts.
 * ------------------------------------------------------------------ */

function two(n: number): string {
  return String(n).padStart(2, "0");
}

/** Real local time as a naive-local `YYYY-MM-DDTHH:mm` string. */
export function currentNaiveLocal(date: Date = new Date()): string {
  return (
    `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}` +
    `T${two(date.getHours())}:${two(date.getMinutes())}`
  );
}

/** Real local civil date, `YYYY-MM-DD`. */
export function currentDate(date: Date = new Date()): string {
  return currentNaiveLocal(date).slice(0, 10);
}

/** Whole days between two naive-local dates — `b - a`. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.slice(0, 10).split("-").map(Number);
  const [by, bm, bd] = b.slice(0, 10).split("-").map(Number);
  return daysFromCivil(by, bm, bd) - daysFromCivil(ay, am, ad);
}
