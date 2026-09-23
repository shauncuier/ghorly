import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Section, SectionHeader } from "@/components/marketing/section";
import { FinalCta } from "@/components/marketing/final-cta";
import { pageMetadata, JsonLd, localBusinessJsonLd } from "@/lib/seo";
import { toBn } from "@/lib/format";
import { BRAND } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: "আমাদের সম্পর্কে",
  description:
    "ঘরলি চট্টগ্রামের ঘরের মালিকদের বিশ্বস্ত স্থানীয় পেশাদারদের সাথে যুক্ত করে। আমাদের গল্প, মূল্যবোধ ও নীতিমালা।",
  path: "/about",
});

const VALUES = [
  {
    icon: ShieldCheck,
    title: "বিশ্বাস আগে",
    body: "প্রতিটি পেশাদারের পরিচয় আমরা যাচাই করি। রেটিং ও রিভিউ গ্রাহকদের, আমাদের নয়।",
  },
  {
    icon: Sparkles,
    title: "স্বচ্ছ দাম",
    body: "কাজের আগেই দাম জানা যায়। লুকানো খরচ নেই, শেষ মুহূর্তে দর বাড়ানো নেই।",
  },
  {
    icon: Users,
    title: "স্থানীয় মানুষ",
    body: "আমাদের পেশাদাররা এই শহরেরই। তাঁদের কাজ তাঁদের পাড়ার সুনামের সাথে জড়িত।",
  },
  {
    icon: Handshake,
    title: "দুই পক্ষের মর্যাদা",
    body: "গ্রাহক যেমন ভালো সেবা পাওয়ার যোগ্য, পেশাদারও তেমনি ন্যায্য দাম ও সম্মানের যোগ্য।",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={localBusinessJsonLd()} />

      <div className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-6 py-10 md:py-16">
          <Breadcrumb
            items={[
              { label: "হোম", href: "/" },
              { label: "আমাদের সম্পর্কে", href: "/about" },
            ]}
          />
          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="text-4xl font-extrabold text-fg md:text-5xl">
              ঘরের কাজ খুঁজে পাওয়া সহজ হওয়া উচিত
            </h1>
            <p className="text-lg text-fg-secondary">
              একটা কল ফুটো হলে, এসি বন্ধ হয়ে গেলে বা বাসা বদলের আগে ঘর পরিষ্কার
              করাতে হলে — চট্টগ্রামে ভরসাযোগ্য মানুষ খুঁজতে এখনো পরিচিতদের ফোন
              করতে হয়। ঘরলি সেই খোঁজাটা সহজ করতে চায়।
            </p>
          </div>
        </div>
      </div>

      <Section size="sm">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-16">
          <div className="flex max-w-2xl flex-col gap-5 text-base text-fg-secondary">
            <h2 className="text-2xl font-bold text-fg">আমাদের গল্প</h2>
            <p>
              ঘরলির শুরু একটা সাধারণ সমস্যা থেকে। শহরে দক্ষ মিস্ত্রি, টেকনিশিয়ান
              আর পরিচ্ছন্নতাকর্মীর অভাব নেই — কিন্তু কাকে ডাকা যায়, কে সময়মতো
              আসবে, কত টাকা নেবে, এসবের কোনো নির্ভরযোগ্য উত্তর নেই।
            </p>
            <p>
              অন্যদিকে পেশাদারদের সমস্যাটা উল্টো। ভালো কাজ জানা সত্ত্বেও নতুন
              গ্রাহক পাওয়া কঠিন, আর কাজের হিসাব রাখার কোনো ব্যবস্থা নেই।
            </p>
            <p>
              ঘরলি দুই দিককে এক জায়গায় আনে। ঘরের মালিক এক জায়গায় যাচাইকৃত
              পেশাদার, স্পষ্ট দাম আর সহজ বুকিং পান। পেশাদাররা পান নিয়মিত কাজ,
              আয়ের হিসাব আর গড়ে ওঠা সুনাম।
            </p>
            <p>
              আমরা শুরু করেছি {BRAND.city} থেকে — কারণ এই শহরটা আমরা চিনি।
            </p>
          </div>

          <dl className="flex h-fit flex-col gap-5 rounded-xl border border-border bg-surface p-6">
            {[
              { label: "প্রতিষ্ঠা", value: toBn(2026) },
              { label: "শহর", value: BRAND.city },
              { label: "সেবার ধরন", value: `${toBn(14)}টি` },
              { label: "এলাকা", value: `${toBn(14)}টি` },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-fg-tertiary">{row.label}</dt>
                <dd className="text-base font-semibold tabular text-fg">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="muted" size="sm">
        <div className="container-page flex flex-col gap-10">
          <SectionHeader title="আমরা যা বিশ্বাস করি" align="center" />
          <ul className="grid gap-4 md:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-4 rounded-xl border border-border bg-surface p-6"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-5" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-semibold text-fg">{title}</h3>
                  <p className="text-base text-fg-secondary">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Policy anchors the footer links point at. */}
      <Section size="sm">
        <div className="container-page flex max-w-3xl flex-col gap-12">
          <section id="safety" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-2xl font-bold text-fg">নিরাপত্তা</h2>
            <p className="text-base text-fg-secondary">
              প্রতিটি পেশাদারের জাতীয় পরিচয়পত্র ও ছবি যাচাই করা হয়। কোনো
              অভিযোগ এলে আমরা দুই পক্ষের বক্তব্য শুনে ব্যবস্থা নিই, প্রয়োজনে
              অ্যাকাউন্ট স্থগিত করি। কাজের সময় কোনো সমস্যা হলে বুকিংয়ের পাতা
              থেকেই অভিযোগ জানানো যায়।
            </p>
          </section>

          <section id="terms" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-2xl font-bold text-fg">শর্তাবলী</h2>
            <p className="text-base text-fg-secondary">
              ঘরলি একটি সংযোগকারী প্ল্যাটফর্ম — আমরা গ্রাহক ও স্বাধীন পেশাদারদের
              মধ্যে যোগাযোগ করিয়ে দিই। কাজের চুক্তি হয় গ্রাহক ও পেশাদারের মধ্যে।
              সম্পন্ন কাজের উপর আমরা একটি নির্ধারিত কমিশন নিই, যা কোটেশনে আগেই
              উল্লেখ থাকে।
            </p>
          </section>

          <section id="privacy" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-2xl font-bold text-fg">গোপনীয়তা</h2>
            <p className="text-base text-fg-secondary">
              আপনার ফোন নম্বর ও ঠিকানা কেবল সেই পেশাদারকে দেখানো হয় যাঁর কোটেশন
              আপনি গ্রহণ করেছেন। আমরা আপনার তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি
              করি না।
            </p>
          </section>

          <section id="careers" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-2xl font-bold text-fg">ক্যারিয়ার</h2>
            <p className="text-base text-fg-secondary">
              আমরা ছোট একটা দল, চট্টগ্রামেই বসে কাজ করি। যোগ দিতে আগ্রহী হলে
              আমাদের লিখুন।
            </p>
            <Button asChild variant="secondary" className="w-fit">
              <Link href="/contact">যোগাযোগ করুন</Link>
            </Button>
          </section>

          <section id="press" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-2xl font-bold text-fg">সংবাদমাধ্যম</h2>
            <p className="text-base text-fg-secondary">
              ঘরলি নিয়ে লিখতে চাইলে বা তথ্য প্রয়োজন হলে যোগাযোগের পাতায় লিখুন —
              আমরা দ্রুত উত্তর দেব।
            </p>
          </section>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
