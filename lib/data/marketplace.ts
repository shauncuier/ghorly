import type {
  Booking,
  Dispute,
  Message,
  MessageThread,
  Payment,
  PayoutMethod,
  Quote,
  ServiceRequest,
  Verification,
} from "@/lib/types";
import { meta } from "@/lib/data/_meta";
import { PROVIDERS, PROVIDER_BY_ID } from "@/lib/data/providers";
import { CUSTOMERS, ADDRESSES } from "@/lib/data/customers";
import { CATEGORY_BY_ID } from "@/lib/data/categories";
import { shiftDays, TODAY } from "@/lib/data/clock";
import { SLOTS } from "@/lib/strings";

/**
 * The interconnected half of the seed data.
 *
 * Requests, quotes, bookings, payments and message threads are generated
 * together rather than hand-authored in separate files, because they reference
 * each other: a booking points at a real quote, which points at a real request
 * from a real customer to a real provider. Authoring them independently would
 * drift out of sync the first time anything changed.
 *
 * Everything here is deterministic — index arithmetic over the provider and
 * customer lists, no randomness, no `Date.now()`.
 */

const COMMISSION_RATE = 0.12;

function slotAt(i: number) {
  return SLOTS[i % SLOTS.length].key;
}

function ts(dayOffset: number, hour: number, minute = 0) {
  return `${shiftDays(TODAY, dayOffset)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/* ==========================================================================
   Request titles and descriptions, per category
   ========================================================================== */

const JOB_COPY: Record<string, [string, string][]> = {
  "cat-plumbing": [
    ["রান্নাঘরের কল দিয়ে পানি পড়ছে", "কল বন্ধ করার পরেও ফোঁটা ফোঁটা পানি পড়ে। ওয়াশার বদলাতে হবে মনে হচ্ছে।"],
    ["বাথরুমের কমোড আটকে গেছে", "দুই দিন ধরে পানি নামছে না। জরুরি ভিত্তিতে দরকার।"],
    ["ছাদের পানির ট্যাংক পরিষ্কার করাতে চাই", "প্রায় দেড় বছর পরিষ্কার করা হয়নি। ট্যাংকটি ১০০০ লিটারের।"],
  ],
  "cat-electrical": [
    ["বেডরুমের সুইচ কাজ করছে না", "দুটি সুইচ একসাথে বন্ধ হয়ে গেছে। ফ্যান ও লাইট দুটোই চলছে না।"],
    ["নতুন সিলিং ফ্যান লাগাতে হবে", "দুটি ফ্যান কেনা আছে, শুধু লাগিয়ে দিতে হবে।"],
    ["আইপিএস সংযোগ দিতে চাই", "নতুন আইপিএস কিনেছি, ঘরের লাইন সংযোগ করে দিতে হবে।"],
  ],
  "cat-ac": [
    ["এসি ঠান্ডা হচ্ছে না", "গত সপ্তাহ থেকে বাতাস আসছে কিন্তু ঠান্ডা হচ্ছে না। গ্যাস শেষ হয়ে থাকতে পারে।"],
    ["এসি সার্ভিসিং করাতে চাই", "দেড় টনের স্প্লিট এসি, প্রায় এক বছর সার্ভিসিং হয়নি।"],
    ["নতুন এসি স্থাপন করাতে হবে", "বেডরুমে ১.৫ টন স্প্লিট এসি লাগাতে হবে। আউটডোর ইউনিট বারান্দায় বসবে।"],
  ],
  "cat-appliance": [
    ["ওয়াশিং মেশিন ঘুরছে না", "চালু হচ্ছে কিন্তু ড্রাম ঘুরছে না। মোটরের সমস্যা হতে পারে।"],
    ["ফ্রিজ ঠান্ডা হচ্ছে না", "নিচের অংশ একেবারেই ঠান্ডা হচ্ছে না, ডিপ ঠিক আছে।"],
  ],
  "cat-cleaning": [
    ["পুরো ফ্ল্যাট পরিষ্কার করাতে চাই", "তিন বেডরুমের ফ্ল্যাট, প্রায় ১৪০০ বর্গফুট। রান্নাঘর ও বাথরুমসহ।"],
    ["বাসা বদলের পর পরিষ্কার", "নতুন বাসায় উঠব, তার আগে পুরোটা পরিষ্কার করিয়ে নিতে চাই।"],
    ["সোফা ও কার্পেট পরিষ্কার", "পাঁচ আসনের সোফা এবং একটি বড় কার্পেট।"],
  ],
  "cat-painting": [
    ["দুই রুম রঙ করাতে চাই", "দেয়ালে কিছু ফাটল আছে, পুটি দিয়ে ঠিক করে রঙ করতে হবে।"],
    ["ছাদে ওয়াটারপ্রুফিং", "বর্ষায় ছাদ দিয়ে পানি চুঁইয়ে পড়ে। স্থায়ী সমাধান চাই।"],
  ],
  "cat-carpentry": [
    ["দরজার লক ভেঙে গেছে", "মূল দরজার লক কাজ করছে না, নতুন লক লাগাতে হবে।"],
    ["রান্নাঘরে কেবিনেট বানাতে চাই", "মাপ নিয়ে একটি ওভারহেড কেবিনেট বানাতে হবে।"],
  ],
  "cat-pest": [
    ["রান্নাঘরে তেলাপোকা", "অনেক দিন ধরে সমস্যা। শিশু আছে, তাই নিরাপদ ওষুধ দরকার।"],
    ["কাঠের আসবাবে উইপোকা", "আলমারি ও খাটে উইপোকার আক্রমণ দেখা যাচ্ছে।"],
  ],
  "cat-cctv": [
    ["বাসায় সিসিটিভি লাগাতে চাই", "চারটি ক্যামেরা, মোবাইলে লাইভ দেখার ব্যবস্থাসহ।"],
  ],
  "cat-internet": [
    ["ওয়াই-ফাই সিগন্যাল দুর্বল", "তিনতলা বাড়ি, উপরের তলায় সিগন্যাল পৌঁছায় না।"],
  ],
  "cat-moving": [
    ["বাসা বদল করতে হবে", "দুই বেডরুমের মালামাল, পাঁচলাইশ থেকে খুলশী।"],
  ],
  "cat-furniture": [
    ["সোফার কুশন বদলাতে চাই", "পুরোনো সোফা, কুশন ও কাপড় দুটোই বদলাতে হবে।"],
  ],
  "cat-gardening": [
    ["ছাদবাগান তৈরি করতে চাই", "প্রায় ৪০০ বর্গফুট ছাদ। টব ও মাটিসহ পুরো ব্যবস্থা দরকার।"],
  ],
  "cat-maintenance": [
    ["ঘরের কয়েকটি ছোট কাজ", "ছবি ঝোলানো, দুটি তাক লাগানো এবং দেয়ালের ছোট ফাটল মেরামত।"],
  ],
};

function copyFor(categoryId: string, i: number): [string, string] {
  const pool = JOB_COPY[categoryId] ?? JOB_COPY["cat-maintenance"];
  return pool[i % pool.length];
}

/* ==========================================================================
   Build
   ========================================================================== */

const requests: ServiceRequest[] = [];
const quotes: Quote[] = [];
const bookings: Booking[] = [];
const payments: Payment[] = [];
const threads: MessageThread[] = [];
const messages: Message[] = [];

let rq = 0;
let qt = 0;
let bk = 0;
let pm = 0;
let th = 0;
let ms = 0;

function pad(n: number) {
  return String(n).padStart(4, "0");
}

function addThread(
  customerId: string,
  providerId: string,
  subject: string,
  bookingId: string | null,
  requestId: string | null,
  lines: { role: "customer" | "provider" | "system"; body: string; dayOffset: number; hour: number }[],
) {
  th += 1;
  const threadId = `thr-${pad(th)}`;
  const messageIds: string[] = [];

  for (const line of lines) {
    ms += 1;
    const id = `msg-${pad(ms)}`;
    const sentAt = ts(line.dayOffset, line.hour);
    messageIds.push(id);
    messages.push({
      _id: id,
      threadId,
      senderRole: line.role,
      senderId:
        line.role === "customer" ? customerId : line.role === "provider" ? providerId : "system",
      bnBody: line.body,
      sentAt,
      isRead: line.dayOffset < -1,
      ...meta(sentAt),
    });
  }

  const last = lines[lines.length - 1];
  threads.push({
    _id: threadId,
    customerId,
    providerId,
    bookingId,
    requestId,
    bnSubject: subject,
    lastMessageAt: ts(last.dayOffset, last.hour),
    messageIds,
    ...meta(ts(lines[0].dayOffset, lines[0].hour)),
  });
  return threadId;
}

/**
 * Completed history — the bulk of the data, and what makes earnings, reviews
 * and admin charts look like a business that has been running.
 */
PROVIDERS.forEach((provider, pIndex) => {
  const historyCount = Math.max(2, Math.min(6, Math.round(provider.completedJobs / 22)));

  for (let i = 0; i < historyCount; i++) {
    const customer = CUSTOMERS[(pIndex * 3 + i * 5) % CUSTOMERS.length];
    const categoryId = provider.categoryIds[i % provider.categoryIds.length];
    const category = CATEGORY_BY_ID[categoryId];
    const [title, description] = copyFor(categoryId, pIndex + i);
    const address = ADDRESSES.find((a) => a.customerId === customer._id)!;
    // Tight enough that the current month always has real completed work —
    // an earnings dashboard reading ৳০ beside a positive trend looks broken.
    const dayOffset = -(2 + i * 6 + (pIndex % 5) * 3);
    const amount =
      (provider.categoryPricing[categoryId] ?? provider.priceFrom) +
      ((pIndex + i) % 5) * 250;

    rq += 1;
    qt += 1;
    bk += 1;
    pm += 1;

    const requestId = `req-${pad(rq)}`;
    const quoteId = `quo-${pad(qt)}`;
    const bookingId = `bkg-${pad(bk)}`;
    const paymentId = `pay-${pad(pm)}`;
    const commission = Math.round(amount * COMMISSION_RATE);

    requests.push({
      _id: requestId,
      customerId: customer._id,
      categoryId,
      bnTitle: title,
      bnDescription: description,
      areaId: address.areaId,
      addressId: address._id,
      preferredDate: shiftDays(TODAY, dayOffset + 2),
      preferredSlot: slotAt(i),
      urgency: i % 3 === 0 ? "soon" : "flexible",
      budgetFrom: null,
      budgetTo: null,
      status: "booked",
      quoteIds: [quoteId],
      bookingId,
      ...meta(ts(dayOffset, 10)),
    });

    quotes.push({
      _id: quoteId,
      requestId,
      providerId: provider._id,
      customerId: customer._id,
      amount,
      bnMessage: `${category?.bnShortName ?? "কাজ"}টি দেখে মনে হচ্ছে ${Math.max(1, Math.round(category?.avgDurationMinutes ?? 60) / 60)} ঘণ্টার মতো লাগবে। যন্ত্রাংশ লাগলে আলাদা জানাব।`,
      estimatedMinutes: category?.avgDurationMinutes ?? 60,
      status: "accepted",
      validUntil: shiftDays(TODAY, dayOffset + 3),
      ...meta(ts(dayOffset, 12)),
    });

    bookings.push({
      _id: bookingId,
      requestId,
      quoteId,
      customerId: customer._id,
      providerId: provider._id,
      categoryId,
      bnTitle: title,
      addressId: address._id,
      areaId: address.areaId,
      scheduledDate: shiftDays(TODAY, dayOffset + 2),
      scheduledSlot: slotAt(i),
      durationMinutes: category?.avgDurationMinutes ?? 60,
      amount,
      commission,
      status: "completed",
      paymentId,
      reviewId: null,
      bnCancelReason: null,
      ...meta(ts(dayOffset, 12)),
    });

    payments.push({
      _id: paymentId,
      bookingId,
      customerId: customer._id,
      providerId: provider._id,
      amount,
      commission,
      method: (["bkash", "nagad", "cash", "card", "rocket"] as const)[(pIndex + i) % 5],
      status: "paid",
      reference: `${customer.phone.slice(0, 5)}****${customer.phone.slice(-2)}`,
      paidAt: ts(dayOffset + 2, 18),
      ...meta(ts(dayOffset + 2, 18)),
    });
  }
});

/**
 * Live pipeline for the demo account (Shaun, `cus-0001`) — an open request
 * with competing quotes, an upcoming booking, and an active job. This is what
 * the customer dashboard has to show on first load.
 */
const demo = CUSTOMERS[0];
const demoAddress = ADDRESSES.find((a) => a.customerId === demo._id)!;

// 1. open request with three quotes
rq += 1;
const openRequestId = `req-${pad(rq)}`;
const acProviders = PROVIDERS.filter((p) => p.categoryIds.includes("cat-ac")).slice(0, 3);

requests.push({
  _id: openRequestId,
  customerId: demo._id,
  categoryId: "cat-ac",
  bnTitle: "এসি ঠান্ডা হচ্ছে না",
  bnDescription:
    "গত সপ্তাহ থেকে বাতাস আসছে কিন্তু ঠান্ডা হচ্ছে না। দেড় টনের স্প্লিট এসি, প্রায় তিন বছরের পুরোনো।",
  areaId: demoAddress.areaId,
  addressId: demoAddress._id,
  preferredDate: shiftDays(TODAY, 1),
  preferredSlot: "evening-1",
  urgency: "soon",
  budgetFrom: 800,
  budgetTo: 2500,
  status: "quoted",
  quoteIds: [],
  bookingId: null,
  ...meta(ts(-1, 9, 40)),
});

acProviders.forEach((provider, i) => {
  qt += 1;
  const quoteId = `quo-${pad(qt)}`;
  requests.find((r) => r._id === openRequestId)!.quoteIds.push(quoteId);

  quotes.push({
    _id: quoteId,
    requestId: openRequestId,
    providerId: provider._id,
    customerId: demo._id,
    amount: [1200, 950, 1450][i],
    bnMessage: [
      "গ্যাস রিফিল ও কয়েল পরিষ্কার দুটোই লাগবে। কাজ শেষে তিন মাসের গ্যারান্টি দিই।",
      "আগে দেখে নিই, গ্যাসের সমস্যা হলে রিফিল করে দেব। দেখার জন্য আলাদা টাকা নিই না।",
      "কম্প্রেসর ঠিক আছে কিনা পরীক্ষা করে জানাব। সম্পূর্ণ সার্ভিসিংসহ এই দাম।",
    ][i],
    estimatedMinutes: [90, 75, 120][i],
    status: "sent",
    validUntil: shiftDays(TODAY, 3),
    ...meta(ts(-1, 11 + i * 2)),
  });

  addThread(
    demo._id,
    provider._id,
    "এসি ঠান্ডা হচ্ছে না",
    null,
    openRequestId,
    [
      { role: "system", body: "কোটেশন পাঠানো হয়েছে।", dayOffset: -1, hour: 11 + i * 2 },
      {
        role: "provider",
        body: "আসসালামু আলাইকুম। এসিটি কত দিন ধরে এই সমস্যা করছে?",
        dayOffset: -1,
        hour: 11 + i * 2,
      },
      { role: "customer", body: "প্রায় এক সপ্তাহ। আগে ঠিকই ছিল।", dayOffset: -1, hour: 12 + i * 2 },
      {
        role: "provider",
        body: "সম্ভবত গ্যাস কমে গেছে। কাল বিকেলে এসে দেখে নিতে পারি।",
        dayOffset: 0,
        hour: 9 + i,
      },
    ],
  );
});

// 2. upcoming booking
rq += 1;
qt += 1;
bk += 1;
pm += 1;
const upcomingRequestId = `req-${pad(rq)}`;
const upcomingQuoteId = `quo-${pad(qt)}`;
const upcomingBookingId = `bkg-${pad(bk)}`;
const upcomingPaymentId = `pay-${pad(pm)}`;
const cleaner = PROVIDERS.find((p) => p.slug === "roksana-begum")!;

requests.push({
  _id: upcomingRequestId,
  customerId: demo._id,
  categoryId: "cat-cleaning",
  bnTitle: "পুরো ফ্ল্যাট পরিষ্কার করাতে চাই",
  bnDescription: "তিন বেডরুমের ফ্ল্যাট, রান্নাঘর ও দুটি বাথরুমসহ।",
  areaId: demoAddress.areaId,
  addressId: demoAddress._id,
  preferredDate: shiftDays(TODAY, 2),
  preferredSlot: "morning-1",
  urgency: "flexible",
  budgetFrom: null,
  budgetTo: null,
  status: "booked",
  quoteIds: [upcomingQuoteId],
  bookingId: upcomingBookingId,
  ...meta(ts(-4, 15)),
});

quotes.push({
  _id: upcomingQuoteId,
  requestId: upcomingRequestId,
  providerId: cleaner._id,
  customerId: demo._id,
  amount: 3200,
  bnMessage: "চারজনের দল নিয়ে আসব, প্রায় পাঁচ ঘণ্টা লাগবে। সব উপকরণ আমাদের।",
  estimatedMinutes: 300,
  status: "accepted",
  validUntil: shiftDays(TODAY, -1),
  ...meta(ts(-4, 17)),
});

bookings.push({
  _id: upcomingBookingId,
  requestId: upcomingRequestId,
  quoteId: upcomingQuoteId,
  customerId: demo._id,
  providerId: cleaner._id,
  categoryId: "cat-cleaning",
  bnTitle: "পুরো ফ্ল্যাট পরিষ্কার করাতে চাই",
  addressId: demoAddress._id,
  areaId: demoAddress.areaId,
  scheduledDate: shiftDays(TODAY, 2),
  scheduledSlot: "morning-1",
  durationMinutes: 300,
  amount: 3200,
  commission: Math.round(3200 * COMMISSION_RATE),
  status: "upcoming",
  paymentId: upcomingPaymentId,
  reviewId: null,
  bnCancelReason: null,
  ...meta(ts(-3, 10)),
});

payments.push({
  _id: upcomingPaymentId,
  bookingId: upcomingBookingId,
  customerId: demo._id,
  providerId: cleaner._id,
  amount: 3200,
  commission: Math.round(3200 * COMMISSION_RATE),
  method: "bkash",
  status: "pending",
  reference: `${demo.phone.slice(0, 5)}****${demo.phone.slice(-2)}`,
  paidAt: null,
  ...meta(ts(-3, 10)),
});

addThread(
  demo._id,
  cleaner._id,
  "পুরো ফ্ল্যাট পরিষ্কার",
  upcomingBookingId,
  upcomingRequestId,
  [
    { role: "system", body: "বুকিং নিশ্চিত হয়েছে।", dayOffset: -3, hour: 10 },
    { role: "provider", body: "ধন্যবাদ। সকাল ৮টায় দল নিয়ে পৌঁছে যাব।", dayOffset: -3, hour: 11 },
    { role: "customer", body: "ঠিক আছে। লিফট আছে, সমস্যা হবে না।", dayOffset: -2, hour: 14 },
  ],
);

/**
 * Open requests from other customers — what the provider dashboard shows as
 * "new requests" waiting for a response.
 */
const OPEN_FOR_PROVIDERS: { categoryId: string; customerIndex: number; dayOffset: number; hour: number }[] = [
  { categoryId: "cat-ac", customerIndex: 4, dayOffset: 0, hour: 8 },
  { categoryId: "cat-appliance", customerIndex: 7, dayOffset: 0, hour: 9 },
  { categoryId: "cat-ac", customerIndex: 11, dayOffset: -1, hour: 16 },
  { categoryId: "cat-plumbing", customerIndex: 2, dayOffset: 0, hour: 7 },
  { categoryId: "cat-electrical", customerIndex: 9, dayOffset: -1, hour: 19 },
  { categoryId: "cat-cleaning", customerIndex: 15, dayOffset: 0, hour: 10 },
  { categoryId: "cat-carpentry", customerIndex: 18, dayOffset: -2, hour: 13 },
  { categoryId: "cat-pest", customerIndex: 21, dayOffset: -1, hour: 11 },
];

OPEN_FOR_PROVIDERS.forEach((spec, i) => {
  const customer = CUSTOMERS[spec.customerIndex % CUSTOMERS.length];
  const address = ADDRESSES.find((a) => a.customerId === customer._id)!;
  const [title, description] = copyFor(spec.categoryId, i);

  rq += 1;
  requests.push({
    _id: `req-${pad(rq)}`,
    customerId: customer._id,
    categoryId: spec.categoryId,
    bnTitle: title,
    bnDescription: description,
    areaId: address.areaId,
    addressId: address._id,
    preferredDate: shiftDays(TODAY, spec.dayOffset + 1),
    preferredSlot: slotAt(i + 2),
    urgency: i % 4 === 0 ? "urgent" : i % 2 === 0 ? "soon" : "flexible",
    budgetFrom: i % 3 === 0 ? 500 : null,
    budgetTo: i % 3 === 0 ? 2000 : null,
    status: "open",
    quoteIds: [],
    bookingId: null,
    ...meta(ts(spec.dayOffset, spec.hour)),
  });
});

/** One active job in progress, so the provider dashboard has a live state. */
const activeBooking = bookings.find((b) => b.providerId === PROVIDERS[0]._id);
if (activeBooking) {
  activeBooking.status = "active";
  activeBooking.scheduledDate = TODAY;
  activeBooking.scheduledSlot = "afternoon-2";
  const linkedPayment = payments.find((p) => p._id === activeBooking.paymentId);
  if (linkedPayment) {
    linkedPayment.status = "pending";
    linkedPayment.paidAt = null;
  }
}

/* ==========================================================================
   Payout methods, verifications, disputes
   ========================================================================== */

export const PAYOUT_METHODS: PayoutMethod[] = PROVIDERS.slice(0, 12).map((p, i) => ({
  _id: `pom-${pad(i + 1)}`,
  ownerId: p._id,
  kind: (["bkash", "nagad", "bank"] as const)[i % 3],
  bnLabel: (["বিকাশ পার্সোনাল", "নগদ অ্যাকাউন্ট", "ইসলামী ব্যাংক"] as const)[i % 3],
  reference: `${p.phone.slice(0, 5)}****${p.phone.slice(-2)}`,
  isDefault: true,
  ...meta(p.joinedAt),
}));

export const VERIFICATIONS: Verification[] = PROVIDERS.map((p, i) => {
  const status = p.isVerified ? "approved" : i % 3 === 0 ? "rejected" : "pending";
  return {
    _id: `ver-${pad(i + 1)}`,
    providerId: p._id,
    status,
    docs: [
      { kind: "nid" as const, bnLabel: "জাতীয় পরিচয়পত্র", isSubmitted: true },
      { kind: "photo" as const, bnLabel: "ছবি", isSubmitted: true },
      { kind: "trade-license" as const, bnLabel: "ট্রেড লাইসেন্স", isSubmitted: i % 2 === 0 },
      { kind: "skill-cert" as const, bnLabel: "দক্ষতার সনদ", isSubmitted: i % 4 === 0 },
    ],
    submittedAt: p.joinedAt,
    reviewedAt: status === "pending" ? null : ts(-30 + (i % 20), 14),
    bnNote:
      status === "rejected"
        ? "জাতীয় পরিচয়পত্রের ছবি স্পষ্ট নয়। আবার জমা দিন।"
        : status === "approved"
          ? "সব কাগজপত্র যাচাই সম্পন্ন।"
          : null,
    ...meta(p.joinedAt),
  };
});

export const DISPUTES: Dispute[] = [
  {
    _id: "dsp-0001",
    bookingId: bookings[3]?._id ?? "bkg-0004",
    raisedByRole: "customer",
    raisedById: CUSTOMERS[5]._id,
    bnReason: "কাজ অসম্পূর্ণ",
    bnDetail: "দুটি কলের মধ্যে একটি ঠিক করা হয়নি, অথচ পুরো টাকা নেওয়া হয়েছে।",
    status: "investigating",
    bnResolution: null,
    resolvedAt: null,
    ...meta(ts(-6, 11)),
  },
  {
    _id: "dsp-0002",
    bookingId: bookings[9]?._id ?? "bkg-0010",
    raisedByRole: "provider",
    raisedById: PROVIDERS[5]._id,
    bnReason: "পেমেন্ট পাইনি",
    bnDetail: "কাজ সম্পন্ন হয়েছে কিন্তু গ্রাহক এখনো পেমেন্ট নিশ্চিত করেননি।",
    status: "open",
    bnResolution: null,
    resolvedAt: null,
    ...meta(ts(-3, 17)),
  },
  {
    _id: "dsp-0003",
    bookingId: bookings[14]?._id ?? "bkg-0015",
    raisedByRole: "customer",
    raisedById: CUSTOMERS[12]._id,
    bnReason: "দেরিতে এসেছেন",
    bnDetail: "নির্ধারিত সময়ের তিন ঘণ্টা পরে এসেছেন, আগে জানানওনি।",
    status: "resolved",
    bnResolution: "পেশাদারকে সতর্ক করা হয়েছে এবং গ্রাহককে ২০% ছাড় দেওয়া হয়েছে।",
    resolvedAt: ts(-12, 15),
    ...meta(ts(-18, 9)),
  },
  {
    _id: "dsp-0004",
    bookingId: bookings[20]?._id ?? "bkg-0021",
    raisedByRole: "customer",
    raisedById: CUSTOMERS[3]._id,
    bnReason: "দাম নিয়ে অসন্তোষ",
    bnDetail: "কোটেশনে যা ছিল তার চেয়ে বেশি টাকা চাওয়া হয়েছে।",
    status: "resolved",
    bnResolution: "কোটেশনের দামেই নিষ্পত্তি হয়েছে, অতিরিক্ত টাকা ফেরত দেওয়া হয়েছে।",
    resolvedAt: ts(-22, 12),
    ...meta(ts(-26, 16)),
  },
];

export const REQUESTS = requests;
export const QUOTES = quotes;
export const BOOKINGS = bookings;
export const PAYMENTS = payments;
export const THREADS = threads;
export const MESSAGES = messages;

export const DEMO_PROVIDER_ID = PROVIDERS[0]._id;
export { PROVIDER_BY_ID };
