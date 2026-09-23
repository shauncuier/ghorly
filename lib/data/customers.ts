import type { Address, Customer } from "@/lib/types";
import { meta } from "@/lib/data/_meta";

interface Seed {
  n: number;
  bnName: string;
  areaId: string;
  phoneTail: string;
  bookingCount: number;
  joinedAt: string;
  addresses: { label: string; line1: string; line2: string; areaId?: string }[];
}

const SEEDS: Seed[] = [
  { n: 1, bnName: "শাওন চৌধুরী", areaId: "area-panchlaish", phoneTail: "13579246", bookingCount: 9, joinedAt: "2025-07-04T10:20", addresses: [
    { label: "বাসা", line1: "বাড়ি ১৪, রোড ৩", line2: "পাঁচলাইশ আবাসিক এলাকা" },
    { label: "অফিস", line1: "লেভেল ৫, ফিনলে স্কয়ার", line2: "আগ্রাবাদ বা/এ", areaId: "area-agrabad" },
  ]},
  { n: 2, bnName: "ফারহানা ইয়াসমিন", areaId: "area-panchlaish", phoneTail: "24681357", bookingCount: 6, joinedAt: "2025-08-12T14:05", addresses: [
    { label: "বাসা", line1: "ফ্ল্যাট ৪বি, সানরাইজ টাওয়ার", line2: "পাঁচলাইশ" },
  ]},
  { n: 3, bnName: "তৌহিদুল আলম", areaId: "area-khulshi", phoneTail: "35792468", bookingCount: 11, joinedAt: "2025-06-28T09:40", addresses: [
    { label: "বাসা", line1: "বাড়ি ২২, রোড ১", line2: "খুলশী আবাসিক" },
  ]},
  { n: 4, bnName: "সাবরিনা হোসেন", areaId: "area-agrabad", phoneTail: "46813579", bookingCount: 7, joinedAt: "2025-09-02T16:30", addresses: [
    { label: "বাসা", line1: "ফ্ল্যাট ৭এ, শাহ আমানত টাওয়ার", line2: "আগ্রাবাদ" },
  ]},
  { n: 5, bnName: "মাহবুব রহমান", areaId: "area-gec", phoneTail: "57913468", bookingCount: 4, joinedAt: "2025-10-15T11:10", addresses: [
    { label: "বাসা", line1: "৮৯ জিইসি সার্কেল", line2: "জিইসি মোড়" },
  ]},
  { n: 6, bnName: "নুসরাত জাহান", areaId: "area-nasirabad", phoneTail: "68024579", bookingCount: 5, joinedAt: "2025-08-25T13:15", addresses: [
    { label: "বাসা", line1: "বাড়ি ৫, লেন ২", line2: "নাসিরাবাদ হাউজিং সোসাইটি" },
  ]},
  { n: 7, bnName: "ইকবাল করিম", areaId: "area-halishahar", phoneTail: "79135680", bookingCount: 8, joinedAt: "2025-07-18T08:50", addresses: [
    { label: "বাসা", line1: "ব্লক জি, বাড়ি ৩১", line2: "হালিশহর হাউজিং এস্টেট" },
  ]},
  { n: 8, bnName: "রেজাউল করিম", areaId: "area-muradpur", phoneTail: "80246791", bookingCount: 3, joinedAt: "2025-11-09T15:45", addresses: [
    { label: "বাসা", line1: "২৭ মুরাদপুর মেইন রোড", line2: "মুরাদপুর" },
  ]},
  { n: 9, bnName: "শারমিন আক্তার", areaId: "area-gec", phoneTail: "91357802", bookingCount: 10, joinedAt: "2025-06-19T12:00", addresses: [
    { label: "বাসা", line1: "ফ্ল্যাট ৩সি, গ্রিন ভিউ", line2: "জিইসি" },
  ]},
  { n: 10, bnName: "আসিফ মাহমুদ", areaId: "area-khulshi", phoneTail: "02468913", bookingCount: 2, joinedAt: "2026-01-06T17:20", addresses: [
    { label: "বাসা", line1: "বাড়ি ৯, রোড ৪", line2: "খুলশী" },
  ]},
  { n: 11, bnName: "তানিয়া সুলতানা", areaId: "area-chawkbazar", phoneTail: "13680247", bookingCount: 6, joinedAt: "2025-09-21T10:35", addresses: [
    { label: "বাসা", line1: "১১২ চকবাজার রোড", line2: "চকবাজার" },
  ]},
  { n: 12, bnName: "কামাল উদ্দিন", areaId: "area-double-mooring", phoneTail: "24791358", bookingCount: 4, joinedAt: "2025-10-30T09:25", addresses: [
    { label: "বাসা", line1: "বাড়ি ৪৪, ডবলমুরিং", line2: "ডবলমুরিং" },
  ]},
  { n: 13, bnName: "সাদিয়া রহমান", areaId: "area-panchlaish", phoneTail: "35802469", bookingCount: 7, joinedAt: "2025-07-27T14:50", addresses: [
    { label: "বাসা", line1: "ফ্ল্যাট ৬এ, রোজ গার্ডেন", line2: "পাঁচলাইশ" },
  ]},
  { n: 14, bnName: "হাবিবুর রহমান", areaId: "area-bayezid", phoneTail: "46913570", bookingCount: 3, joinedAt: "2025-12-03T11:40", addresses: [
    { label: "বাসা", line1: "৬৭ বায়েজিদ বোস্তামী রোড", line2: "বায়েজিদ" },
  ]},
  { n: 15, bnName: "রুমানা পারভীন", areaId: "area-nasirabad", phoneTail: "57024681", bookingCount: 5, joinedAt: "2025-08-08T16:05", addresses: [
    { label: "বাসা", line1: "বাড়ি ১৮, রোড ২", line2: "নাসিরাবাদ" },
  ]},
  { n: 16, bnName: "জাহাঙ্গীর আলম", areaId: "area-pahartali", phoneTail: "68135792", bookingCount: 6, joinedAt: "2025-09-14T08:30", addresses: [
    { label: "বাসা", line1: "৩৩ পাহাড়তলী বাজার রোড", line2: "পাহাড়তলী" },
  ]},
  { n: 17, bnName: "মেহজাবিন হক", areaId: "area-khulshi", phoneTail: "79246803", bookingCount: 8, joinedAt: "2025-06-24T13:55", addresses: [
    { label: "বাসা", line1: "ফ্ল্যাট ৯বি, হিল ভিউ", line2: "খুলশী" },
  ]},
  { n: 18, bnName: "শহীদুল ইসলাম", areaId: "area-kotwali", phoneTail: "80357914", bookingCount: 2, joinedAt: "2026-02-01T10:15", addresses: [
    { label: "বাসা", line1: "৫৬ কোতোয়ালী রোড", line2: "কোতোয়ালী" },
  ]},
  { n: 19, bnName: "আফরোজা বেগম", areaId: "area-agrabad", phoneTail: "91468025", bookingCount: 9, joinedAt: "2025-07-11T15:20", addresses: [
    { label: "বাসা", line1: "ফ্ল্যাট ২ডি, আগ্রাবাদ টাওয়ার", line2: "আগ্রাবাদ" },
  ]},
  { n: 20, bnName: "নাঈম হাসান", areaId: "area-chandgaon", phoneTail: "02579136", bookingCount: 3, joinedAt: "2025-11-22T12:45", addresses: [
    { label: "বাসা", line1: "বাড়ি ৭, চান্দগাঁও আবাসিক", line2: "চান্দগাঁও" },
  ]},
  { n: 21, bnName: "সুমাইয়া আক্তার", areaId: "area-halishahar", phoneTail: "13680258", bookingCount: 5, joinedAt: "2025-10-07T09:10", addresses: [
    { label: "বাসা", line1: "ব্লক বি, বাড়ি ১৯", line2: "হালিশহর" },
  ]},
  { n: 22, bnName: "আরিফুল হক", areaId: "area-gec", phoneTail: "24791369", bookingCount: 4, joinedAt: "2025-12-18T14:25", addresses: [
    { label: "বাসা", line1: "৪১ জিইসি মোড়", line2: "জিইসি" },
  ]},
  { n: 23, bnName: "লুবনা তাসনিম", areaId: "area-muradpur", phoneTail: "35802470", bookingCount: 6, joinedAt: "2025-08-30T11:00", addresses: [
    { label: "বাসা", line1: "ফ্ল্যাট ৫এ, মুরাদপুর প্লাজা", line2: "মুরাদপুর" },
  ]},
  { n: 24, bnName: "ফয়সাল আহমেদ", areaId: "area-panchlaish", phoneTail: "46913581", bookingCount: 7, joinedAt: "2025-07-22T16:40", addresses: [
    { label: "বাসা", line1: "বাড়ি ২৬, রোড ৫", line2: "পাঁচলাইশ" },
  ]},
];

export const CUSTOMERS: Customer[] = SEEDS.map((s) => {
  const id = `cus-${String(s.n).padStart(4, "0")}`;
  return {
    _id: id,
    bnName: s.bnName,
    phone: `018${s.phoneTail}`,
    email: `customer${s.n}@example.com`,
    areaId: s.areaId,
    addressIds: s.addresses.map((_, i) => `adr-${String(s.n).padStart(4, "0")}-${i + 1}`),
    status: "active",
    bookingCount: s.bookingCount,
    ...meta(s.joinedAt, "2026-03-10T12:00"),
  };
});

export const ADDRESSES: Address[] = SEEDS.flatMap((s) =>
  s.addresses.map((a, i) => ({
    _id: `adr-${String(s.n).padStart(4, "0")}-${i + 1}`,
    customerId: `cus-${String(s.n).padStart(4, "0")}`,
    bnLabel: a.label,
    bnLine1: a.line1,
    bnLine2: a.line2,
    areaId: a.areaId ?? s.areaId,
    isDefault: i === 0,
    ...meta(s.joinedAt),
  })),
);

export const CUSTOMER_BY_ID = Object.fromEntries(
  CUSTOMERS.map((c) => [c._id, c]),
) as Record<string, Customer>;

export const ADDRESS_BY_ID = Object.fromEntries(
  ADDRESSES.map((a) => [a._id, a]),
) as Record<string, Address>;

/** The signed-in customer for the prototype's demo account. */
export const DEMO_CUSTOMER_ID = "cus-0001";
