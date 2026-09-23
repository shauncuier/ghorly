import type { Testimonial } from "@/lib/types";
import { meta } from "@/lib/data/_meta";

/**
 * Landing-page testimonials.
 *
 * Lengths vary on purpose — eight reviews of identical length read as
 * generated copy. One is a four-star rather than five, because a wall of
 * perfect scores is less believable than an honest one.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    _id: "tst-0001",
    bnName: "ফারহানা ইয়াসমিন",
    areaId: "area-panchlaish",
    categoryId: "cat-ac",
    rating: 5,
    bnBody:
      "নির্ভরযোগ্য এসি টেকনিশিয়ান খুঁজতে আগে সারাদিন লেগে যেত। ঘরলিতে কাছেই একজনকে পেলাম, আর কয়েক মিনিটেই বুকিং হয়ে গেল।",
    ...meta("2026-02-11T14:20"),
  },
  {
    _id: "tst-0002",
    bnName: "তৌহিদুল আলম",
    areaId: "area-khulshi",
    categoryId: "cat-electrical",
    rating: 5,
    bnBody:
      "দাম আগেই জানতে পারলাম, কাজের পর বাড়তি কোনো খরচ চাওয়া হয়নি। এটাই সবচেয়ে ভালো লেগেছে।",
    ...meta("2026-01-29T10:05"),
  },
  {
    _id: "tst-0003",
    bnName: "সাবরিনা হোসেন",
    areaId: "area-agrabad",
    categoryId: "cat-cleaning",
    rating: 5,
    bnBody:
      "বাসা বদলের পর পুরো ফ্ল্যাট পরিষ্কার করিয়েছি। চারজনের দল এসেছিল, সকাল থেকে বিকেল পর্যন্ত কাজ করে ঝকঝকে করে দিয়ে গেছে। রান্নাঘরের অবস্থা দেখে আমি নিজেই হতাশ হয়ে গিয়েছিলাম, কিন্তু ওঁরা সামলে নিয়েছেন।",
    ...meta("2026-02-19T17:45"),
  },
  {
    _id: "tst-0004",
    bnName: "মাহবুব রহমান",
    areaId: "area-gec",
    categoryId: "cat-plumbing",
    rating: 4,
    bnBody:
      "কাজ ভালো হয়েছে, তবে আসতে বলা সময়ের চেয়ে আধা ঘণ্টা দেরি হয়েছিল। ফোনে জানিয়ে দিয়েছিলেন বলে সমস্যা হয়নি।",
    ...meta("2026-02-03T09:30"),
  },
  {
    _id: "tst-0005",
    bnName: "নুসরাত জাহান",
    areaId: "area-nasirabad",
    categoryId: "cat-pest",
    rating: 5,
    bnBody:
      "বাসায় ছোট বাচ্চা আছে বলে ওষুধ নিয়ে চিন্তায় ছিলাম। টেকনিশিয়ান নিজে থেকেই কোন কেমিক্যাল ব্যবহার করছেন তা দেখিয়ে বুঝিয়ে দিলেন।",
    ...meta("2026-01-17T11:50"),
  },
  {
    _id: "tst-0006",
    bnName: "ইকবাল করিম",
    areaId: "area-halishahar",
    categoryId: "cat-painting",
    rating: 5,
    bnBody:
      "বর্ষার আগে ছাদের ওয়াটারপ্রুফিং করিয়েছিলাম। এবারের বৃষ্টিতে এক ফোঁটাও পানি পড়েনি।",
    ...meta("2025-12-22T16:10"),
  },
  {
    _id: "tst-0007",
    bnName: "রেজাউল করিম",
    areaId: "area-muradpur",
    categoryId: "cat-carpentry",
    rating: 4,
    bnBody:
      "রান্নাঘরের কেবিনেট বানিয়ে নিয়েছি। মাপ নিখুঁত হয়েছে এবং কাঠের মানও ভালো।",
    ...meta("2026-02-27T13:25"),
  },
  {
    _id: "tst-0008",
    bnName: "শারমিন আক্তার",
    areaId: "area-gec",
    categoryId: "cat-appliance",
    rating: 5,
    bnBody:
      "ওয়াশিং মেশিন নষ্ট হওয়ার পর নতুন কেনার কথা ভাবছিলাম। টেকনিশিয়ান দেখে বললেন মোটর বদলালেই চলবে — অর্ধেকেরও কম খরচে কাজ হয়ে গেল। সততার জন্যই আবার ডাকব।",
    ...meta("2026-03-05T15:00"),
  },
];
