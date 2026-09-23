/**
 * Shared Bangla copy.
 *
 * The split is deliberate. Strings that are derived from an enum, or that
 * appear in three or more files, live here — otherwise 55 pages drift and
 * the same booking state ends up labelled "চলমান" on one screen and "সক্রিয়"
 * on another, which is exactly what breaks the illusion of a real product.
 *
 * One-off page prose — hero headlines, section intros, FAQ answers, the about
 * page — stays inline next to the markup it styles, where it reads better.
 *
 * There is no language toggle and no message catalogue: Bangla is the only
 * language this product speaks.
 */

import type {
  BookingStatus,
  DisputeStatus,
  PaymentStatus,
  QuoteStatus,
  RequestStatus,
  Role,
  Tone,
  UrgencyLevel,
  VerificationStatus,
} from "@/lib/types";

export const BRAND = {
  /** Latin wordmark — always rendered with `font-latin` and `lang="en"`. */
  wordmark: "GHORLY",
  bnName: "ঘরলি",
  tagline: "আপনার ঘরের জন্য বিশ্বস্ত সেবা।",
  supporting: "ঘরের প্রতিটি কাজের জন্য বিশ্বস্ত পেশাদার খুঁজে নিন।",
  city: "চট্টগ্রাম",
} as const;

/* ==========================================================================
   Status registry
   --------------------------------------------------------------------------
   <StatusBadge domain="booking" status={s} /> is the ONLY way a status is ever
   rendered. Label and tone both come from here, so a state cannot pick up two
   different names in two different views.
   ========================================================================== */

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const STATUS: {
  request: Record<RequestStatus, StatusMeta>;
  quote: Record<QuoteStatus, StatusMeta>;
  booking: Record<BookingStatus, StatusMeta>;
  payment: Record<PaymentStatus, StatusMeta>;
  verification: Record<VerificationStatus, StatusMeta>;
  dispute: Record<DisputeStatus, StatusMeta>;
} = {
  request: {
    open: { label: "খোলা", tone: "accent" },
    quoted: { label: "কোটেশন এসেছে", tone: "warning" },
    booked: { label: "বুক হয়েছে", tone: "success" },
    cancelled: { label: "বাতিল", tone: "neutral" },
    expired: { label: "মেয়াদ শেষ", tone: "neutral" },
  },
  quote: {
    sent: { label: "পাঠানো হয়েছে", tone: "warning" },
    accepted: { label: "গৃহীত", tone: "success" },
    declined: { label: "প্রত্যাখ্যাত", tone: "neutral" },
    withdrawn: { label: "প্রত্যাহৃত", tone: "neutral" },
  },
  booking: {
    upcoming: { label: "আসন্ন", tone: "accent" },
    active: { label: "চলমান", tone: "warning" },
    completed: { label: "সম্পন্ন", tone: "success" },
    cancelled: { label: "বাতিল", tone: "neutral" },
  },
  payment: {
    pending: { label: "বকেয়া", tone: "warning" },
    paid: { label: "পরিশোধিত", tone: "success" },
    refunded: { label: "ফেরত দেওয়া হয়েছে", tone: "neutral" },
    failed: { label: "ব্যর্থ", tone: "danger" },
  },
  verification: {
    pending: { label: "যাচাই চলছে", tone: "warning" },
    approved: { label: "যাচাইকৃত", tone: "success" },
    rejected: { label: "প্রত্যাখ্যাত", tone: "danger" },
  },
  dispute: {
    open: { label: "খোলা", tone: "warning" },
    investigating: { label: "তদন্তাধীন", tone: "warning" },
    resolved: { label: "নিষ্পত্তি হয়েছে", tone: "success" },
    rejected: { label: "খারিজ", tone: "neutral" },
  },
};

export const URGENCY: Record<UrgencyLevel, StatusMeta> = {
  flexible: { label: "সময় নমনীয়", tone: "neutral" },
  soon: { label: "শীঘ্রই দরকার", tone: "warning" },
  urgent: { label: "জরুরি", tone: "danger" },
};

export const ROLE_BN: Record<Role, string> = {
  guest: "অতিথি",
  customer: "গ্রাহক",
  provider: "পেশাদার",
  admin: "প্রশাসক",
};

export const ACCOUNT_STATUS_BN: Record<"active" | "suspended", StatusMeta> = {
  active: { label: "সক্রিয়", tone: "success" },
  suspended: { label: "স্থগিত", tone: "danger" },
};

export const PAYMENT_METHOD_BN = {
  bkash: "বিকাশ",
  nagad: "নগদ",
  rocket: "রকেট",
  card: "কার্ড",
  cash: "নগদ অর্থ",
  bank: "ব্যাংক",
} as const;

/* ==========================================================================
   Navigation
   ========================================================================== */

export interface NavItem {
  href: string;
  label: string;
  /** lucide icon name, resolved by the sidebar. */
  icon?: string;
}

export const NAV = {
  marketing: [
    { href: "/services", label: "সেবাসমূহ" },
    { href: "/how-it-works", label: "কীভাবে কাজ করে" },
    { href: "/for-professionals", label: "পেশাদারদের জন্য" },
    { href: "/locations", label: "এলাকাসমূহ" },
    { href: "/about", label: "আমাদের সম্পর্কে" },
  ] satisfies NavItem[],

  customer: [
    { href: "/customer", label: "ড্যাশবোর্ড", icon: "layout-dashboard" },
    { href: "/customer/services", label: "সেবা খুঁজুন", icon: "search" },
    { href: "/customer/requests", label: "আমার অনুরোধ", icon: "file-text" },
    { href: "/customer/quotes", label: "কোটেশন", icon: "receipt-text" },
    { href: "/customer/bookings", label: "বুকিং", icon: "calendar-check" },
    { href: "/customer/messages", label: "বার্তা", icon: "message-square" },
    { href: "/customer/favorites", label: "পছন্দের তালিকা", icon: "heart" },
    { href: "/customer/addresses", label: "ঠিকানা", icon: "map-pin" },
    { href: "/customer/payments", label: "পেমেন্ট", icon: "credit-card" },
    { href: "/customer/reviews", label: "রিভিউ", icon: "star" },
    { href: "/customer/settings", label: "সেটিংস", icon: "settings" },
  ] satisfies NavItem[],

  provider: [
    { href: "/provider", label: "ড্যাশবোর্ড", icon: "layout-dashboard" },
    { href: "/provider/requests", label: "নতুন অনুরোধ", icon: "inbox" },
    { href: "/provider/quotes", label: "কোটেশন", icon: "receipt-text" },
    { href: "/provider/jobs", label: "কাজ", icon: "briefcase" },
    { href: "/provider/calendar", label: "ক্যালেন্ডার", icon: "calendar" },
    { href: "/provider/services", label: "আমার সেবা", icon: "wrench" },
    { href: "/provider/availability", label: "সময়সূচি", icon: "clock" },
    { href: "/provider/earnings", label: "আয়", icon: "wallet" },
    { href: "/provider/reviews", label: "রিভিউ", icon: "star" },
    { href: "/provider/messages", label: "বার্তা", icon: "message-square" },
    { href: "/provider/verification", label: "যাচাইকরণ", icon: "shield-check" },
    { href: "/provider/settings", label: "সেটিংস", icon: "settings" },
  ] satisfies NavItem[],

  admin: [
    { href: "/admin", label: "ড্যাশবোর্ড", icon: "layout-dashboard" },
    { href: "/admin/customers", label: "গ্রাহক", icon: "users" },
    { href: "/admin/professionals", label: "পেশাদার", icon: "hard-hat" },
    { href: "/admin/verification", label: "যাচাইকরণ", icon: "shield-check" },
    { href: "/admin/services", label: "সেবা", icon: "wrench" },
    { href: "/admin/requests", label: "অনুরোধ", icon: "file-text" },
    { href: "/admin/bookings", label: "বুকিং", icon: "calendar-check" },
    { href: "/admin/payments", label: "পেমেন্ট", icon: "credit-card" },
    { href: "/admin/reviews", label: "রিভিউ", icon: "star" },
    { href: "/admin/disputes", label: "বিরোধ", icon: "triangle-alert" },
    { href: "/admin/locations", label: "এলাকা", icon: "map-pin" },
    { href: "/admin/reports", label: "রিপোর্ট", icon: "chart-column" },
    { href: "/admin/settings", label: "সেটিংস", icon: "settings" },
  ] satisfies NavItem[],

  /** Mobile bottom bars — five items, the most-used routes only. */
  customerMobile: [
    { href: "/customer", label: "হোম", icon: "house" },
    { href: "/customer/services", label: "সেবা", icon: "search" },
    { href: "/customer/bookings", label: "বুকিং", icon: "calendar-check" },
    { href: "/customer/messages", label: "বার্তা", icon: "message-square" },
    { href: "/customer/settings", label: "প্রোফাইল", icon: "user" },
  ] satisfies NavItem[],

  providerMobile: [
    { href: "/provider", label: "হোম", icon: "house" },
    { href: "/provider/requests", label: "অনুরোধ", icon: "inbox" },
    { href: "/provider/jobs", label: "কাজ", icon: "briefcase" },
    { href: "/provider/earnings", label: "আয়", icon: "wallet" },
    { href: "/provider/settings", label: "প্রোফাইল", icon: "user" },
  ] satisfies NavItem[],
} as const;

/* ==========================================================================
   Actions
   ========================================================================== */

export const ACTIONS = {
  accept: "গ্রহণ করুন",
  decline: "প্রত্যাখ্যান করুন",
  sendQuote: "কোটেশন পাঠান",
  withdrawQuote: "কোটেশন প্রত্যাহার",
  book: "বুক করুন",
  requestService: "সেবার অনুরোধ করুন",
  confirmBooking: "বুকিং নিশ্চিত করুন",
  cancel: "বাতিল করুন",
  reschedule: "সময় পরিবর্তন",
  startJob: "কাজ শুরু করুন",
  completeJob: "কাজ সম্পন্ন করুন",
  save: "সংরক্ষণ করুন",
  saveChanges: "পরিবর্তন সংরক্ষণ করুন",
  edit: "সম্পাদনা করুন",
  delete: "মুছে ফেলুন",
  remove: "সরিয়ে ফেলুন",
  add: "যোগ করুন",
  next: "পরবর্তী",
  back: "পূর্ববর্তী",
  submit: "জমা দিন",
  close: "বন্ধ করুন",
  viewProfile: "প্রোফাইল দেখুন",
  viewDetails: "বিস্তারিত দেখুন",
  viewRequest: "অনুরোধ দেখুন",
  viewAll: "সব দেখুন",
  sendMessage: "বার্তা পাঠান",
  writeReview: "রিভিউ লিখুন",
  tryAgain: "আবার চেষ্টা করুন",
  findService: "সেবা খুঁজুন",
  findProfessionals: "পেশাদার খুঁজুন",
  becomeProfessional: "পেশাদার হিসেবে যোগ দিন",
  getStarted: "শুরু করুন",
  login: "লগ ইন",
  logout: "লগ আউট",
  register: "নিবন্ধন করুন",
  learnMore: "আরও জানুন",
  approve: "অনুমোদন করুন",
  reject: "প্রত্যাখ্যান করুন",
  suspend: "স্থগিত করুন",
  reinstate: "পুনর্বহাল করুন",
  refund: "ফেরত দিন",
  resolve: "নিষ্পত্তি করুন",
  requestPayout: "টাকা উত্তোলন করুন",
  filter: "ফিল্টার",
  clearFilters: "ফিল্টার মুছুন",
  apply: "প্রয়োগ করুন",
} as const;

/* ==========================================================================
   Empty states
   ========================================================================== */

interface EmptyCopy {
  title: string;
  body: string;
  cta?: string;
  href?: string;
}

export const EMPTY: Record<string, EmptyCopy> = {
  bookings: {
    title: "এখনো কোনো বুকিং নেই",
    body: "আপনার বুক করা সেবাগুলো এখানে দেখা যাবে।",
    cta: ACTIONS.findService,
    href: "/customer/services",
  },
  upcomingBookings: {
    title: "আসন্ন কোনো বুকিং নেই",
    body: "নতুন সেবা বুক করলে সেটি এখানে দেখা যাবে।",
    cta: ACTIONS.findService,
    href: "/customer/services",
  },
  messages: {
    title: "কোনো বার্তা নেই",
    body: "পেশাদারদের সাথে আপনার কথোপকথন এখানে দেখা যাবে।",
  },
  favorites: {
    title: "পছন্দের তালিকা খালি",
    body: "যেসব পেশাদারকে আপনি বিশ্বাস করেন, তাঁদের পরে খুঁজে পেতে সংরক্ষণ করুন।",
    cta: ACTIONS.findProfessionals,
    href: "/customer/services",
  },
  requests: {
    title: "কোনো অনুরোধ নেই",
    body: "ঘরের কোনো কাজ দরকার? আমাদের জানান, আমরা উপযুক্ত পেশাদার খুঁজে দেব।",
    cta: ACTIONS.requestService,
    href: "/customer/request",
  },
  quotes: {
    title: "এখনো কোনো কোটেশন আসেনি",
    body: "পেশাদাররা আপনার অনুরোধে সাড়া দিলে তাঁদের কোটেশন এখানে দেখা যাবে।",
  },
  addresses: {
    title: "কোনো ঠিকানা যোগ করা হয়নি",
    body: "ঠিকানা সংরক্ষণ করলে পরবর্তী বুকিং আরও দ্রুত হবে।",
    cta: "ঠিকানা যোগ করুন",
  },
  payments: {
    title: "কোনো লেনদেন নেই",
    body: "আপনার পেমেন্টের ইতিহাস এখানে দেখা যাবে।",
  },
  reviews: {
    title: "কোনো রিভিউ নেই",
    body: "সেবা সম্পন্ন হলে আপনি পেশাদারের রিভিউ দিতে পারবেন।",
  },
  providerRequests: {
    title: "নতুন কোনো অনুরোধ নেই",
    body: "আপনার এলাকা ও সেবার সাথে মিলে গেলে নতুন অনুরোধ এখানে আসবে।",
  },
  providerQuotes: {
    title: "কোনো কোটেশন পাঠানো হয়নি",
    body: "অনুরোধ গ্রহণ করে কোটেশন পাঠালে সেগুলো এখানে দেখা যাবে।",
    cta: "অনুরোধ দেখুন",
    href: "/provider/requests",
  },
  providerJobs: {
    title: "কোনো কাজ নেই",
    body: "গ্রাহক আপনার কোটেশন গ্রহণ করলে কাজটি এখানে যুক্ত হবে।",
  },
  providerEarnings: {
    title: "এখনো কোনো আয় নেই",
    body: "কাজ সম্পন্ন করলে আপনার আয় এখানে দেখা যাবে।",
  },
  providerReviews: {
    title: "এখনো কোনো রিভিউ নেই",
    body: "কাজ শেষ হওয়ার পর গ্রাহকদের দেওয়া রিভিউ এখানে দেখা যাবে।",
  },
  searchResults: {
    title: "কোনো পেশাদার পাওয়া যায়নি",
    body: "ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন, অথবা অন্য এলাকা বেছে নিন।",
    cta: ACTIONS.clearFilters,
  },
  verifications: {
    title: "যাচাইয়ের অপেক্ষায় কেউ নেই",
    body: "নতুন পেশাদার নিবন্ধন করলে তাঁদের কাগজপত্র এখানে দেখা যাবে।",
  },
  disputes: {
    title: "কোনো বিরোধ নেই",
    body: "গ্রাহক বা পেশাদার অভিযোগ জানালে তা এখানে দেখা যাবে।",
  },
  notifications: {
    title: "কোনো নোটিফিকেশন নেই",
    body: "নতুন কিছু ঘটলে আমরা আপনাকে এখানে জানাব।",
  },
};

/* ==========================================================================
   Errors & validation
   ========================================================================== */

export const ERRORS = {
  generic: {
    title: "কিছু একটা সমস্যা হয়েছে",
    body: "আমরা তথ্য লোড করতে পারিনি। আবার চেষ্টা করুন।",
  },
  requests: {
    title: "কিছু একটা সমস্যা হয়েছে",
    body: "আপনার সেবার অনুরোধগুলো লোড করা যায়নি।",
  },
  notFound: {
    title: "পাতাটি খুঁজে পাওয়া যায়নি",
    body: "আপনি যে পাতাটি খুঁজছেন সেটি সরানো হয়েছে অথবা কখনো ছিল না।",
    cta: "হোমে ফিরে যান",
  },
  providerNotFound: {
    title: "পেশাদার খুঁজে পাওয়া যায়নি",
    body: "এই প্রোফাইলটি আর উপলব্ধ নেই।",
  },
} as const;

export const VALIDATION = {
  required: "এই ঘরটি পূরণ করুন",
  phone: "সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)",
  email: "সঠিক ইমেইল ঠিকানা দিন",
  minLength: "আরও বিস্তারিত লিখুন",
  selectOne: "একটি বিকল্প বেছে নিন",
  selectDate: "একটি তারিখ বেছে নিন",
  positiveAmount: "সঠিক পরিমাণ লিখুন",
} as const;

/* ==========================================================================
   ARIA labels
   ========================================================================== */

export const ARIA = {
  openMenu: "মেনু খুলুন",
  closeMenu: "মেনু বন্ধ করুন",
  closeDialog: "বন্ধ করুন",
  openFilters: "ফিল্টার খুলুন",
  previousPage: "আগের পাতা",
  nextPage: "পরের পাতা",
  pagination: "পাতা নির্বাচন",
  breadcrumb: "ব্রেডক্রাম্ব",
  mainNav: "প্রধান মেনু",
  sidebarNav: "সাইডবার মেনু",
  bottomNav: "নিচের মেনু",
  userMenu: "অ্যাকাউন্ট মেনু",
  notifications: "নোটিফিকেশন",
  search: "খুঁজুন",
  addToFavorites: "পছন্দের তালিকায় যোগ করুন",
  removeFromFavorites: "পছন্দের তালিকা থেকে সরান",
  rating: "রেটিং",
  verified: "যাচাইকৃত পেশাদার",
  loading: "লোড হচ্ছে",
  chart: "চার্ট",
} as const;

/* ==========================================================================
   Misc repeated copy
   ========================================================================== */

export const COMMON = {
  verified: "যাচাইকৃত",
  verifiedProfessional: "যাচাইকৃত পেশাদার",
  completedJobs: "সম্পন্ন কাজ",
  startingFrom: "শুরু",
  perVisit: "প্রতি ভিজিট",
  responseTime: "সাড়া দেওয়ার সময়",
  serviceArea: "সেবার এলাকা",
  experience: "অভিজ্ঞতা",
  years: "বছর",
  reviews: "রিভিউ",
  loading: "লোড হচ্ছে…",
  all: "সব",
  today: "আজ",
  tomorrow: "আগামীকাল",
  yesterday: "গতকাল",
  morning: "সকাল",
  afternoon: "দুপুর",
  evening: "সন্ধ্যা",
  optional: "ঐচ্ছিক",
  required: "আবশ্যক",
  showMore: "আরও দেখুন",
  showLess: "কম দেখুন",
  noResults: "কোনো ফলাফল নেই",
  searchPlaceholder: "সেবা খুঁজুন…",
  locationPlaceholder: "চট্টগ্রাম",
} as const;

/** Booking slot keys → Bangla labels. Shared by availability, wizard and calendar. */
export const SLOTS: { key: string; label: string; start: string }[] = [
  { key: "morning-1", label: "সকাল ৮টা – ১০টা", start: "08:00" },
  { key: "morning-2", label: "সকাল ১০টা – ১২টা", start: "10:00" },
  { key: "afternoon-1", label: "দুপুর ১২টা – ২টা", start: "12:00" },
  { key: "afternoon-2", label: "দুপুর ২টা – ৪টা", start: "14:00" },
  { key: "evening-1", label: "বিকেল ৪টা – ৬টা", start: "16:00" },
  { key: "evening-2", label: "সন্ধ্যা ৬টা – ৮টা", start: "18:00" },
];

export const SLOT_LABEL: Record<string, string> = Object.fromEntries(
  SLOTS.map((s) => [s.key, s.label]),
);
