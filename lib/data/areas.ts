import type { Area } from "@/lib/types";
import { meta } from "@/lib/data/_meta";

/**
 * Chattogram service areas.
 *
 * `mapX` / `mapY` are percentage coordinates over the stylized city SVG in
 * `components/marketing/chattogram-map.tsx`. They position real HTML buttons
 * on top of a decorative silhouette — the SVG itself is `aria-hidden`, so the
 * hotspots keep native focus rings, keyboard order and Bangla labels.
 *
 * Rough geography: Khulshi and Pahartali sit north, Panchlaish and Nasirabad
 * west of centre, GEC in the middle, and Agrabad, Halishahar and the port to
 * the south-east along the Karnaphuli.
 */
export const AREAS: Area[] = [
  {
    _id: "area-panchlaish",
    slug: "panchlaish",
    bnName: "পাঁচলাইশ",
    providerCount: 78,
    isActive: true,
    mapX: 30,
    mapY: 42,
    isHeadline: true,
    ...meta(),
  },
  {
    _id: "area-khulshi",
    slug: "khulshi",
    bnName: "খুলশী",
    providerCount: 64,
    isActive: true,
    mapX: 44,
    mapY: 22,
    isHeadline: true,
    ...meta(),
  },
  {
    _id: "area-gec",
    slug: "gec",
    bnName: "জিইসি মোড়",
    providerCount: 71,
    isActive: true,
    mapX: 45,
    mapY: 40,
    isHeadline: true,
    ...meta(),
  },
  {
    _id: "area-agrabad",
    slug: "agrabad",
    bnName: "আগ্রাবাদ",
    providerCount: 69,
    isActive: true,
    mapX: 63,
    mapY: 62,
    isHeadline: true,
    ...meta(),
  },
  {
    _id: "area-nasirabad",
    slug: "nasirabad",
    bnName: "নাসিরাবাদ",
    providerCount: 55,
    isActive: true,
    mapX: 24,
    mapY: 32,
    isHeadline: true,
    ...meta(),
  },
  {
    _id: "area-halishahar",
    slug: "halishahar",
    bnName: "হালিশহর",
    providerCount: 47,
    isActive: true,
    mapX: 77,
    mapY: 47,
    isHeadline: true,
    ...meta(),
  },
  {
    _id: "area-muradpur",
    slug: "muradpur",
    bnName: "মুরাদপুর",
    providerCount: 43,
    isActive: true,
    mapX: 18,
    mapY: 50,
    isHeadline: true,
    ...meta(),
  },
  {
    _id: "area-chawkbazar",
    slug: "chawkbazar",
    bnName: "চকবাজার",
    providerCount: 38,
    isActive: true,
    mapX: 34,
    mapY: 56,
    isHeadline: false,
    ...meta(),
  },
  {
    _id: "area-bayezid",
    slug: "bayezid",
    bnName: "বায়েজিদ",
    providerCount: 32,
    isActive: true,
    mapX: 21,
    mapY: 22,
    isHeadline: false,
    ...meta(),
  },
  {
    _id: "area-pahartali",
    slug: "pahartali",
    bnName: "পাহাড়তলী",
    providerCount: 29,
    isActive: true,
    mapX: 62,
    mapY: 18,
    isHeadline: false,
    ...meta(),
  },
  {
    _id: "area-kotwali",
    slug: "kotwali",
    bnName: "কোতোয়ালী",
    providerCount: 27,
    isActive: true,
    mapX: 41,
    mapY: 70,
    isHeadline: false,
    ...meta(),
  },
  {
    _id: "area-double-mooring",
    slug: "double-mooring",
    bnName: "ডবলমুরিং",
    providerCount: 25,
    isActive: true,
    mapX: 57,
    mapY: 55,
    isHeadline: false,
    ...meta(),
  },
  {
    _id: "area-chandgaon",
    slug: "chandgaon",
    bnName: "চান্দগাঁও",
    providerCount: 23,
    isActive: true,
    mapX: 13,
    mapY: 63,
    isHeadline: false,
    ...meta(),
  },
  {
    _id: "area-bandar",
    slug: "bandar",
    bnName: "বন্দর",
    providerCount: 18,
    isActive: true,
    mapX: 71,
    mapY: 76,
    isHeadline: false,
    ...meta(),
  },
];

export const AREA_BY_ID = Object.fromEntries(AREAS.map((a) => [a._id, a])) as Record<
  string,
  Area
>;

export const AREA_BY_SLUG = Object.fromEntries(AREAS.map((a) => [a.slug, a])) as Record<
  string,
  Area
>;

export const HEADLINE_AREAS = AREAS.filter((a) => a.isHeadline);
