import type { Review } from "@/lib/types";
import { meta } from "@/lib/data/_meta";
import { PROVIDERS } from "@/lib/data/providers";
import { CUSTOMERS } from "@/lib/data/customers";
import { shiftDays, TODAY } from "@/lib/data/clock";

/**
 * Reviews are composed from a hand-authored Bangla pool and distributed across
 * providers deterministically — index arithmetic only, never `Math.random()`,
 * so the server and the browser build the identical list.
 *
 * The pool varies in length on purpose (eight words to sixty). A wall of
 * same-length reviews is one of the clearest tells that a marketplace is
 * seeded rather than used.
 */

/** [body, rating offset from the provider's average] */
const POOL: [string, number][] = [
  ["দ্রুত এসে কাজ শেষ করে দিয়েছেন। ধন্যবাদ।", 0.2],
  ["সময়মতো এসেছেন, কাজও পরিষ্কার। আবার ডাকব।", 0.2],
  [
    "ফোন করার এক ঘণ্টার মধ্যে চলে এসেছিলেন। সমস্যাটা দেখেই বুঝে ফেললেন কোথায় গণ্ডগোল। কাজ শেষে জায়গাটা পরিষ্কার করে দিয়ে গেছেন, এটা আলাদা করে ভালো লেগেছে।",
    0.3,
  ],
  ["দাম আগেই বলে দিয়েছিলেন, পরে বাড়াননি।", 0.1],
  ["কাজ ভালো, তবে আসতে একটু দেরি করেছিলেন।", -0.4],
  ["খুব ভদ্র এবং পেশাদার আচরণ।", 0.2],
  [
    "পুরোনো লাইন ছিল, অনেকেই হাত দিতে চায়নি। উনি ধৈর্য নিয়ে পুরোটা দেখে সমাধান করেছেন।",
    0.3,
  ],
  ["মোটামুটি ভালো। আরেকটু যত্ন নিলে ভালো হতো।", -0.6],
  ["নির্ধারিত সময়ের আগেই কাজ শেষ।", 0.2],
  ["যন্ত্রাংশের বিল দেখিয়ে দিয়েছেন, স্বচ্ছতা ভালো লেগেছে।", 0.2],
  [
    "দ্বিতীয়বার ডাকলাম, আগের বারের মতোই ভালো কাজ করেছেন। এখন আর অন্য কাউকে খুঁজি না।",
    0.3,
  ],
  ["কাজের মান ঠিক আছে, দামও যুক্তিসঙ্গত।", 0.1],
  ["ছোট একটা সমস্যা রয়ে গিয়েছিল, জানানোর পর এসে ঠিক করে দিয়েছেন।", -0.2],
  ["অভিজ্ঞ হাত, বোঝা যায়।", 0.2],
  [
    "বাসায় বাচ্চা আছে জানার পর নিজে থেকেই সাবধানে কাজ করেছেন এবং জিনিসপত্র গুছিয়ে রেখেছেন।",
    0.3,
  ],
  ["সন্তুষ্ট। সুপারিশ করব।", 0.2],
  ["কথা দিয়ে কথা রেখেছেন — এটাই সবচেয়ে বড় ব্যাপার।", 0.2],
  ["প্রথমে একটু সন্দেহ ছিল, কিন্তু কাজ দেখে ভুল ভেঙেছে।", 0.1],
  ["ঠিকঠাক কাজ। বিশেষ কিছু বলার নেই।", -0.5],
  [
    "আমি নিজে দাঁড়িয়ে পুরো কাজটা দেখেছি। প্রতিটা ধাপ বুঝিয়ে বলেছেন, কেন কোনটা করছেন। এমন মানুষ পাওয়া কঠিন।",
    0.3,
  ],
  ["দ্রুত সাড়া দিয়েছেন, জরুরি অবস্থায় খুব কাজে দিয়েছে।", 0.2],
  ["কাজ শেষ, কিন্তু আশেপাশে কিছুটা ময়লা রেখে গেছেন।", -0.7],
  ["ভালো কাজ করেছেন, ধন্যবাদ।", 0.1],
  ["যা বলেছিলেন ঠিক তাই করেছেন, বাড়তি কিছু চাপাননি।", 0.2],
];

const REPLIES: (string | null)[] = [
  "ধন্যবাদ। আবার প্রয়োজন হলে জানাবেন।",
  null,
  null,
  "সময় নিয়ে রিভিউ দেওয়ার জন্য কৃতজ্ঞতা।",
  "দেরির জন্য দুঃখিত। পরেরবার সময়ের ব্যাপারে আরও সতর্ক থাকব।",
  null,
];

function clampRating(n: number) {
  return Math.min(5, Math.max(1, Math.round(n * 2) / 2));
}

const built: Review[] = [];
let counter = 0;

PROVIDERS.forEach((provider, pIndex) => {
  // Show a representative handful per provider, scaled to their review count.
  const count = Math.min(8, Math.max(2, Math.round(provider.reviewCount / 14)));

  for (let i = 0; i < count; i++) {
    counter += 1;
    const pool = POOL[(pIndex * 3 + i * 5) % POOL.length];
    const customer = CUSTOMERS[(pIndex * 2 + i * 7) % CUSTOMERS.length];
    const categoryId = provider.categoryIds[i % provider.categoryIds.length];
    const daysAgo = 4 + i * 11 + (pIndex % 5) * 3;

    built.push({
      _id: `rev-${String(counter).padStart(4, "0")}`,
      bookingId: `bkg-seed-${counter}`,
      providerId: provider._id,
      customerId: customer._id,
      categoryId,
      rating: clampRating(provider.rating + pool[1]),
      bnBody: pool[0],
      isHidden: false,
      bnProviderReply: REPLIES[(pIndex + i) % REPLIES.length],
      ...meta(`${shiftDays(TODAY, -daysAgo)}T${String(9 + (i % 9)).padStart(2, "0")}:${i % 2 ? "30" : "15"}`),
    });
  }
});

export const REVIEWS: Review[] = built;

export function reviewsForProvider(providerId: string): Review[] {
  return REVIEWS.filter((r) => r.providerId === providerId && !r.isHidden);
}

/** Star distribution, 5 → 1, for the rating histogram on provider profiles. */
export function ratingBreakdown(providerId: string): number[] {
  const list = reviewsForProvider(providerId);
  const buckets = [0, 0, 0, 0, 0];
  for (const r of list) {
    const idx = 5 - Math.round(r.rating);
    if (idx >= 0 && idx < 5) buckets[idx] += 1;
  }
  return buckets;
}
