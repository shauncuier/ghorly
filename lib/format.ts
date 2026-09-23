/**
 * Bangla formatting.
 *
 * Every number, price, rating, count, date and phone number rendered anywhere in
 * Ghorly passes through this module. A bare `{someNumber}` in JSX is a bug.
 *
 * These are hand-rolled rather than `Intl` / `toLocaleString` on purpose: a
 * small-ICU Node build has no `bn` locale and would emit Latin digits on the
 * server while the browser emitted Bangla ones — a guaranteed hydration
 * mismatch on every price in the app.
 */

import { NOW, daysFromCivil } from "@/lib/data/clock";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

const MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

const MONTHS_SHORT = [
  "জানু",
  "ফেব",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্ট",
  "অক্টো",
  "নভে",
  "ডিসে",
] as const;

/** Sunday-first, matching the Bangladeshi week. */
const WEEKDAYS_SHORT = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"] as const;
const WEEKDAYS_LONG = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
] as const;

export { MONTHS, MONTHS_SHORT, WEEKDAYS_SHORT, WEEKDAYS_LONG };

/* ==========================================================================
   Digits
   ========================================================================== */

/** `2,000` → `২,০০০`. Non-digit characters pass through untouched. */
export function toBn(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** `২,০০০` → `2,000`. For parsing numbers a user typed in Bangla. */
export function toEn(value: string): string {
  return value.replace(/[০-৯]/g, (d) =>
    String(d.charCodeAt(0) - 0x09e6),
  );
}

/**
 * Bangladeshi digit grouping: three digits, then groups of two.
 * `123456` → `১,২৩,৪৫৬`   `12345678` → `১,২৩,৪৫,৬৭৮`
 */
export function groupBn(n: number): string {
  const negative = n < 0;
  const [whole, fraction] = Math.abs(n).toString().split(".");

  let grouped: string;
  if (whole.length <= 3) {
    grouped = whole;
  } else {
    const last3 = whole.slice(-3);
    const rest = whole.slice(0, -3);
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }

  const out = fraction ? `${grouped}.${fraction}` : grouped;
  return toBn(negative ? `-${out}` : out);
}

/* ==========================================================================
   Money
   ========================================================================== */

interface BdtOptions {
  /** Collapse to হাজার / লাখ / কোটি. */
  compact?: boolean;
  /** Decimal places. Defaults to 0 for full numbers, 2 for compact. */
  decimals?: number;
  /** Drop the ৳ symbol. */
  symbol?: boolean;
}

/**
 * `800` → `৳৮০০`
 * `1500` → `৳১,৫০০`
 * `125000` compact → `৳১.২৫ লাখ`
 * `24000000` compact → `৳২.৪ কোটি`
 */
export function formatBdt(n: number, options: BdtOptions = {}): string {
  const { compact = false, decimals, symbol = true } = options;
  const prefix = symbol ? "৳" : "";

  if (!compact) {
    const rounded = decimals === undefined ? Math.round(n) : Number(n.toFixed(decimals));
    return prefix + groupBn(rounded);
  }

  return prefix + formatCompact(n, decimals ?? 2);
}

/** `৳৮০০ – ৳১,৫০০` */
export function formatBdtRange(from: number, to: number, options?: BdtOptions): string {
  if (from === to) return formatBdt(from, options);
  return `${formatBdt(from, options)} – ${formatBdt(to, options)}`;
}

/** `থেকে ৳৮০০` — the "starting price" form used on provider cards. */
export function formatBdtFrom(n: number): string {
  return `থেকে ${formatBdt(n)}`;
}

/* ==========================================================================
   Numbers
   ========================================================================== */

/**
 * `12500` → `১২.৫ হাজার`   `125000` → `১.২৫ লাখ`   `24000000` → `২.৪ কোটি`
 * Trailing zeros are trimmed, so `2000000` reads `২০ লাখ`, not `২০.০০ লাখ`.
 */
export function formatCompact(n: number, decimals = 2): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  const scale = (divisor: number, unit: string) => {
    const value = abs / divisor;
    const fixed = value.toFixed(decimals).replace(/\.?0+$/, "");
    return `${toBn(sign + fixed)} ${unit}`;
  };

  if (abs >= 1_00_00_000) return scale(1_00_00_000, "কোটি");
  if (abs >= 1_00_000) return scale(1_00_000, "লাখ");
  if (abs >= 1_000) return scale(1_000, "হাজার");
  return groupBn(n);
}

/** Always one decimal place: `4.9` → `৪.৯`, `5` → `৫.০` */
export function formatRating(n: number): string {
  return toBn(n.toFixed(1));
}

/** `127, 'কাজ'` → `১২৭টি কাজ`. Without a unit, just the grouped number. */
export function formatCount(n: number, unit?: string): string {
  return unit ? `${groupBn(n)}টি ${unit}` : groupBn(n);
}

/** `2000` → `২,০০০+` — for the trust-bar style metrics. */
export function formatCountPlus(n: number): string {
  return `${groupBn(n)}+`;
}

/** `12` → `১২%`; signed → `+১২%` / `-১২%` */
export function formatPercent(n: number, signed = false): string {
  const sign = signed && n > 0 ? "+" : "";
  return `${toBn(sign + String(n))}%`;
}

/**
 * Bangla ordinals, used by the request wizard: `৩য় ধাপ`.
 */
export function formatOrdinal(n: number): string {
  const table: Record<number, string> = {
    1: "১ম",
    2: "২য়",
    3: "৩য়",
    4: "৪র্থ",
    5: "৫ম",
    6: "৬ষ্ঠ",
    7: "৭ম",
    8: "৮ম",
    9: "৯ম",
    10: "১০ম",
  };
  return table[n] ?? `${toBn(n)}তম`;
}

/* ==========================================================================
   Time
   ========================================================================== */

interface TimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const TS_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

/**
 * Parse a naive-local `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` string.
 * Deliberately regex-based — `new Date(iso)` would resolve against the host
 * timezone, which differs between the server and the browser.
 */
export function parseTs(ts: string): TimeParts {
  const match = TS_PATTERN.exec(ts);
  if (!match) {
    throw new Error(`Invalid timestamp: ${ts}. Expected YYYY-MM-DD[THH:mm].`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] ? Number(match[4]) : 0,
    minute: match[5] ? Number(match[5]) : 0,
  };
}

/** Minutes since the epoch, timezone-free. Used for all time arithmetic. */
function toMinutes(parts: TimeParts): number {
  return (
    daysFromCivil(parts.year, parts.month, parts.day) * 1440 +
    parts.hour * 60 +
    parts.minute
  );
}

/** `0` = রবিবার. 1970-01-01 was a Thursday, hence the `+ 4`. */
export function weekdayIndex(ts: string): number {
  const { year, month, day } = parseTs(ts);
  return (((daysFromCivil(year, month, day) + 4) % 7) + 7) % 7;
}

export type DateStyle = "long" | "medium" | "short" | "monthYear" | "dayMonth";

/**
 * `long`      → `১৫ মার্চ ২০২৬`
 * `medium`    → `সোম, ১৫ মার্চ`
 * `short`     → `১৫/০৩/২৬`
 * `monthYear` → `মার্চ ২০২৬`
 * `dayMonth`  → `১৫ মার্চ`
 */
export function formatDate(ts: string, style: DateStyle = "long"): string {
  const { year, month, day } = parseTs(ts);
  const monthName = MONTHS[month - 1];

  switch (style) {
    case "long":
      return `${toBn(day)} ${monthName} ${toBn(year)}`;
    case "medium":
      return `${WEEKDAYS_SHORT[weekdayIndex(ts)]}, ${toBn(day)} ${monthName}`;
    case "short":
      return toBn(
        `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${String(year).slice(-2)}`,
      );
    case "monthYear":
      return `${monthName} ${toBn(year)}`;
    case "dayMonth":
      return `${toBn(day)} ${monthName}`;
  }
}

/** The Bangla part-of-day word that precedes a clock time. */
function dayPart(hour: number): string {
  if (hour >= 4 && hour <= 5) return "ভোর";
  if (hour >= 6 && hour <= 11) return "সকাল";
  if (hour >= 12 && hour <= 15) return "দুপুর";
  if (hour >= 16 && hour <= 17) return "বিকেল";
  if (hour >= 18 && hour <= 19) return "সন্ধ্যা";
  return "রাত";
}

/** `14:30` → `দুপুর ২:৩০`   `10:00` → `সকাল ১০:০০` */
export function formatTime(ts: string): string {
  const { hour, minute } = parseTs(ts);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${dayPart(hour)} ${toBn(hour12)}:${toBn(String(minute).padStart(2, "0"))}`;
}

/** `১৫ মার্চ, সকাল ১০:৩০` */
export function formatDateTime(ts: string, style: DateStyle = "dayMonth"): string {
  return `${formatDate(ts, style)}, ${formatTime(ts)}`;
}

/**
 * `এইমাত্র` · `৫ মিনিট আগে` · `৩ ঘণ্টা আগে` · `গতকাল` · `৫ দিন আগে`
 * · `২ সপ্তাহ আগে` · `৩ মাস আগে`
 *
 * `now` defaults to the frozen clock, never to `Date.now()`.
 */
export function formatRelativeTime(ts: string, now: string = NOW): string {
  const diff = toMinutes(parseTs(now)) - toMinutes(parseTs(ts));
  const future = diff < 0;
  const mins = Math.abs(diff);
  const suffix = future ? "পরে" : "আগে";

  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${toBn(mins)} মিনিট ${suffix}`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${toBn(hours)} ঘণ্টা ${suffix}`;

  const days = Math.floor(hours / 24);
  if (days === 1) return future ? "আগামীকাল" : "গতকাল";
  if (days < 7) return `${toBn(days)} দিন ${suffix}`;
  if (days < 30) return `${toBn(Math.floor(days / 7))} সপ্তাহ ${suffix}`;
  if (days < 365) return `${toBn(Math.floor(days / 30))} মাস ${suffix}`;
  return `${toBn(Math.floor(days / 365))} বছর ${suffix}`;
}

/** `90` → `১ ঘণ্টা ৩০ মিনিট`   `45` → `৪৫ মিনিট`   `120` → `২ ঘণ্টা` */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${toBn(mins)} মিনিট`;
  if (mins === 0) return `${toBn(hours)} ঘণ্টা`;
  return `${toBn(hours)} ঘণ্টা ${toBn(mins)} মিনিট`;
}

/** Response-time badge copy: `৩০ মিনিটের মধ্যে সাড়া দেন` */
export function formatResponseTime(minutes: number): string {
  return `${formatDuration(minutes)}ের মধ্যে সাড়া দেন`;
}

/** Is this timestamp on the frozen "today"? */
export function isToday(ts: string, now: string = NOW): boolean {
  return ts.slice(0, 10) === now.slice(0, 10);
}

/* ==========================================================================
   Misc
   ========================================================================== */

/** `01712345678` → `০১৭১২-৩৪৫৬৭৮` */
export function formatPhone(raw: string): string {
  const digits = toEn(raw).replace(/\D/g, "");
  if (digits.length !== 11) return toBn(raw);
  return toBn(`${digits.slice(0, 5)}-${digits.slice(5)}`);
}

/**
 * First grapheme of a Bangla name, for initial avatars.
 * `Intl.Segmenter` keeps conjuncts and vowel signs together — a naive `name[0]`
 * would slice `রাহিম` correctly but shred `ক্ষুদ্র` into a broken glyph.
 */
export function firstGrapheme(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
    const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
    if (!first.done) return first.value.segment;
  }
  return Array.from(trimmed)[0] ?? "?";
}

/**
 * Stable non-negative hash of an id, for picking an avatar tint or a
 * placeholder shade. Deterministic, so server and client always agree.
 */
export function hashId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}
