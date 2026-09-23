import type { AdminMetrics } from "@/lib/types";
import { CATEGORIES } from "@/lib/data/categories";
import { PROVIDERS } from "@/lib/data/providers";
import { CUSTOMERS } from "@/lib/data/customers";
import { BOOKINGS, PAYMENTS, REQUESTS } from "@/lib/data/marketplace";
import { MONTHS } from "@/lib/format";
import { toBn } from "@/lib/format";

/**
 * Admin dashboard figures.
 *
 * Headline numbers are *computed from the seed data* rather than hand-typed,
 * so the dashboard can never contradict the tables it sits above — a mismatch
 * between "মোট বুকিং" and the length of the bookings list is exactly the kind
 * of detail that gets noticed in a demo.
 *
 * The twelve-month series are hand-shaped (a business that grows, with a dip
 * in the monsoon months) since the seed data only covers recent activity.
 */

const completed = BOOKINGS.filter((b) => b.status === "completed");
const revenue = PAYMENTS.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
const commission = PAYMENTS.filter((p) => p.status === "paid").reduce(
  (s, p) => s + p.commission,
  0,
);

/** Monsoon dip in জুন–আগস্ট, steady growth either side. */
const REVENUE_SHAPE = [
  0.42, 0.48, 0.55, 0.61, 0.69, 0.58, 0.54, 0.63, 0.75, 0.84, 0.92, 1,
];
const BOOKING_SHAPE = [
  0.45, 0.52, 0.58, 0.64, 0.71, 0.6, 0.57, 0.66, 0.78, 0.86, 0.94, 1,
];

const PEAK_REVENUE = 1_860_000;
const PEAK_BOOKINGS = 412;

/** Month labels ending at the frozen clock's month (মার্চ ২০২৬). */
function trailingMonths(): string[] {
  const endIndex = 2; // মার্চ
  return Array.from({ length: 12 }, (_, i) => MONTHS[(endIndex - 11 + i + 24) % 12]);
}

const monthLabels = trailingMonths();

export const ADMIN_METRICS: AdminMetrics = {
  totalCustomers: CUSTOMERS.length,
  totalProviders: PROVIDERS.length,
  activeRequests: REQUESTS.filter((r) => r.status === "open" || r.status === "quoted").length,
  completedJobs: completed.length,
  revenue,
  commission,
  deltas: {
    customers: 12,
    providers: 8,
    requests: 21,
    jobs: 15,
    revenue: 18,
    commission: 18,
  },
  revenueByMonth: REVENUE_SHAPE.map((f, i) => ({
    label: monthLabels[i],
    value: Math.round(PEAK_REVENUE * f),
  })),
  bookingsByMonth: BOOKING_SHAPE.map((f, i) => ({
    label: monthLabels[i],
    value: Math.round(PEAK_BOOKINGS * f),
  })),
  userGrowthByWeek: Array.from({ length: 8 }, (_, i) => ({
    label: `${toBn(i + 1)} সপ্তাহ`,
    customers: 120 + i * 34 + (i % 3) * 9,
    providers: 28 + i * 7 + (i % 2) * 3,
  })),
  bookingsByCategory: [...CATEGORIES]
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 6)
    .map((c) => ({ label: c.bnShortName, value: c.jobCount })),
};
