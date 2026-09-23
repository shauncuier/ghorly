import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FinalCta } from "@/components/marketing/final-cta";
import { TrustBar } from "@/components/marketing/trust-bar";
import { pageMetadata } from "@/lib/seo";
import { toBn } from "@/lib/format";

export const metadata: Metadata = pageMetadata({
  title: "কীভাবে কাজ করে",
  description:
    "ঘরলিতে সেবা নেওয়ার পুরো প্রক্রিয়া — অনুরোধ থেকে কোটেশন, বুকিং থেকে কাজ সম্পন্ন।",
  path: "/how-it-works",
});

const DETAIL = [
  {
    title: "অনুরোধ পাঠান",
    body: "কী কাজ, কোথায় এবং কখন দরকার — ছয়টি ছোট ধাপে জানান। কোনো খরচ নেই, ফোন নম্বর কাউকে দেখানো হয় না।",
    points: ["সেবার ধরন বেছে নিন", "সমস্যাটি সংক্ষেপে লিখুন", "ঠিকানা ও সময় দিন"],
  },
  {
    title: "কোটেশন পান",
    body: "আপনার এলাকার উপযুক্ত পেশাদাররা অনুরোধটি দেখে দাম ও সময় জানিয়ে কোটেশন পাঠাবেন।",
    points: ["একাধিক কোটেশন তুলনা করুন", "রেটিং ও কাজের রেকর্ড দেখুন", "প্রশ্ন থাকলে বার্তায় জিজ্ঞেস করুন"],
  },
  {
    title: "বুক করুন",
    body: "পছন্দের কোটেশন গ্রহণ করলেই বুকিং নিশ্চিত হয়। পেশাদার নির্ধারিত সময়ে পৌঁছে যাবেন।",
    points: ["সময় ঠিক করুন", "কাজের অগ্রগতি দেখুন", "কাজ শেষে পেমেন্ট"],
  },
  {
    title: "রিভিউ দিন",
    body: "কাজ শেষে আপনার অভিজ্ঞতা জানান। আপনার রিভিউ পরের গ্রাহককে সিদ্ধান্ত নিতে সাহায্য করবে।",
    points: ["রেটিং দিন", "অভিজ্ঞতা লিখুন", "পছন্দ হলে সংরক্ষণ করুন"],
  },
];

const FAQS = [
  {
    q: "অনুরোধ পাঠাতে কি টাকা লাগে?",
    a: "না। অনুরোধ পাঠানো, কোটেশন দেখা এবং পেশাদারদের সাথে কথা বলা সম্পূর্ণ বিনামূল্যে। আপনি শুধু কাজের জন্য টাকা দেবেন।",
  },
  {
    q: "পেশাদারদের যাচাই কীভাবে করা হয়?",
    a: "প্রতিটি পেশাদারের জাতীয় পরিচয়পত্র, ছবি এবং কাজের অভিজ্ঞতার তথ্য আমরা যাচাই করি। যাচাই সম্পন্ন হলে প্রোফাইলে 'যাচাইকৃত' চিহ্ন দেখাবে।",
  },
  {
    q: "দাম কি আগে থেকে জানা যায়?",
    a: "হ্যাঁ। প্রতিটি কোটেশনে কাজের দাম ও আনুমানিক সময় লেখা থাকে। আপনি রাজি হলেই কেবল বুকিং হয়, পরে বাড়তি খরচ চাপানো হয় না।",
  },
  {
    q: "কাজ পছন্দ না হলে কী করব?",
    a: "বুকিংয়ের পাতা থেকে সরাসরি অভিযোগ জানাতে পারবেন। আমাদের দল দুই পক্ষের কথা শুনে বিষয়টি নিষ্পত্তি করবে।",
  },
  {
    q: "কোন এলাকায় সেবা পাওয়া যায়?",
    a: "এই মুহূর্তে চট্টগ্রাম শহরের ১৪টি এলাকায় আমরা সেবা দিচ্ছি — পাঁচলাইশ, খুলশী, জিইসি, আগ্রাবাদ, নাসিরাবাদ, হালিশহর, মুরাদপুরসহ আরও কয়েকটি।",
  },
  {
    q: "কীভাবে টাকা পরিশোধ করব?",
    a: "বিকাশ, নগদ, রকেট, কার্ড অথবা নগদ অর্থ — যেটি আপনার সুবিধা। কাজ সম্পন্ন হওয়ার পরেই পেমেন্ট করবেন।",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="container-page flex max-w-3xl flex-col gap-4 py-14 md:py-20">
          <span className="text-sm font-semibold text-teal-700">কীভাবে কাজ করে</span>
          <h1 className="text-4xl font-extrabold text-fg md:text-5xl">
            খোঁজা থেকে কাজ শেষ — পুরো পথটা
          </h1>
          <p className="text-lg text-fg-secondary">
            ঘরলি কীভাবে আপনাকে সঠিক পেশাদারের কাছে পৌঁছে দেয়, ধাপে ধাপে।
          </p>
        </div>
      </div>

      <HowItWorks />

      <Section size="sm">
        <div className="container-page flex flex-col gap-10">
          <SectionHeader
            title="বিস্তারিত প্রক্রিয়া"
            description="প্রতিটি ধাপে আপনি কী করবেন এবং আমরা কী করব।"
          />

          <ol className="flex flex-col gap-4">
            {DETAIL.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 md:flex-row md:gap-8"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-50 text-base font-extrabold tabular text-teal-700">
                  <span className="-translate-y-px">{toBn(i + 1)}</span>
                </span>
                <div className="flex flex-col gap-2.5 md:flex-1">
                  <h3 className="text-xl font-semibold text-fg">{step.title}</h3>
                  <p className="text-base text-fg-secondary">{step.body}</p>
                </div>
                <ul className="flex flex-col gap-1.5 md:w-64">
                  {step.points.map((p) => (
                    <li key={p} className="text-sm text-fg-tertiary">
                      · {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <TrustBar />

      <Section tone="muted" size="sm">
        <div className="container-page grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-fg">সাধারণ প্রশ্ন</h2>
            <p className="text-base text-fg-secondary">
              উত্তর না পেলে আমাদের জানান — আমরা সাহায্য করব।
            </p>
            <Button asChild variant="secondary" className="w-fit">
              <Link href="/contact">যোগাযোগ করুন</Link>
            </Button>
          </div>
          <FaqAccordion items={FAQS} />
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
