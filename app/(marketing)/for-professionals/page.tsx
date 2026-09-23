import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { ForProfessionals } from "@/components/marketing/for-professionals";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { pageMetadata } from "@/lib/seo";
import { formatPercent, toBn } from "@/lib/format";
import { ACTIONS } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: "পেশাদারদের জন্য",
  description:
    "ঘরলিতে যোগ দিয়ে চট্টগ্রামের নতুন গ্রাহকের কাছে পৌঁছান। কাজ, আয় ও সুনাম — সব এক জায়গায়।",
  path: "/for-professionals",
});

const STEPS = [
  { title: "নিবন্ধন করুন", body: "নাম, পেশা ও এলাকা দিয়ে প্রোফাইল তৈরি করুন। পাঁচ মিনিটের কাজ।" },
  { title: "যাচাই করান", body: "জাতীয় পরিচয়পত্র ও ছবি জমা দিন। যাচাই হলে প্রোফাইলে বিশেষ চিহ্ন পাবেন।" },
  { title: "দাম ঠিক করুন", body: "আপনার এলাকার কাজ এলে ঘরলি টিম ফোনে আপনার সাথে দাম ও সময় ঠিক করবে।" },
  { title: "কাজ পান", body: "গ্রাহক রাজি হলে কাজটি আপনার তালিকায় যুক্ত হবে — বাকি যোগাযোগ ঘরলি টিম সামলাবে।" },
];

const TERMS = [
  "নিবন্ধন সম্পূর্ণ বিনামূল্যে",
  "মাসিক কোনো ফি নেই",
  "শুধু সম্পন্ন কাজের উপর কমিশন",
  "যেকোনো সময় বন্ধ করতে পারবেন",
];

const FAQS = [
  {
    q: "ঘরলিতে যোগ দিতে কত খরচ?",
    a: "নিবন্ধন ও প্রোফাইল তৈরি সম্পূর্ণ বিনামূল্যে। কোনো মাসিক ফি নেই। কাজ সম্পন্ন হলে আমরা একটি নির্দিষ্ট কমিশন রাখি, বাকিটা আপনার।",
  },
  {
    q: "যাচাইকরণে কী কী লাগে?",
    a: "জাতীয় পরিচয়পত্রের ছবি, আপনার একটি স্পষ্ট ছবি এবং কাজ সংক্রান্ত অভিজ্ঞতার তথ্য। ট্রেড লাইসেন্স থাকলে ভালো, না থাকলেও সমস্যা নেই।",
  },
  {
    q: "কাজের অনুরোধ কীভাবে পাব?",
    a: "আপনি যে সেবা ও এলাকা বেছে নেবেন, সেই অনুযায়ী ঘরলি টিম আপনার সাথে যোগাযোগ করবে। দাম ঠিক হলে ও গ্রাহক রাজি হলে কাজটি আপনার ড্যাশবোর্ডে আসবে।",
  },
  {
    q: "টাকা কবে পাব?",
    a: "কাজ সম্পন্ন হিসেবে চিহ্নিত হওয়ার পর আপনার অ্যাকাউন্টে যোগ হবে। বিকাশ, নগদ বা ব্যাংকে উত্তোলন করতে পারবেন।",
  },
  {
    q: "একসাথে কয়টি সেবা দিতে পারব?",
    a: "যতগুলো আপনি দক্ষ। প্রোফাইলে একাধিক সেবা যোগ করলে বেশি অনুরোধ পাবেন।",
  },
];

export default function ForProfessionalsPage() {
  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="container-page grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <span className="text-sm font-semibold text-teal-700">পেশাদারদের জন্য</span>
            <h1 className="text-4xl font-extrabold text-fg md:text-5xl">
              আপনার দক্ষতা, আরও বেশি ঘরে
            </h1>
            <p className="text-lg text-fg-secondary">
              চট্টগ্রামের শত শত পরিবার প্রতিদিন নির্ভরযোগ্য হাতের খোঁজ করছে।
              ঘরলিতে যোগ দিন, কাজ আপনার কাছে আসবে।
            </p>
            <ul className="flex flex-col gap-2.5">
              {TERMS.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-base text-fg-secondary">
                  <Check aria-hidden="true" strokeWidth={2.5} className="size-4 shrink-0 text-teal-600" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register/provider">{ACTIONS.becomeProfessional}</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login?role=provider">পেশাদার লগ ইন</Link>
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {[
              { value: `${toBn(500)}+`, label: "সক্রিয় পেশাদার" },
              { value: `${toBn("2,000")}+`, label: "সম্পন্ন কাজ" },
              { value: formatPercent(18, true), label: "মাসিক প্রবৃদ্ধি" },
              { value: `${toBn(14)}টি`, label: "এলাকা" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-6"
              >
                <dd className="text-3xl font-extrabold tabular text-fg">{m.value}</dd>
                <dt className="text-sm text-fg-secondary">{m.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Section size="sm">
        <div className="container-page flex flex-col gap-10">
          <SectionHeader
            title="শুরু করবেন কীভাবে"
            description="চারটি ধাপ, এক দিনেই শেষ।"
            align="center"
          />
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6"
              >
                <span className="grid size-10 place-items-center rounded-full bg-teal-50 text-sm font-extrabold tabular text-teal-700">
                  <span className="-translate-y-px">{toBn(i + 1)}</span>
                </span>
                <h3 className="text-lg font-semibold text-fg">{step.title}</h3>
                <p className="text-sm text-fg-secondary">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <ForProfessionals />

      <Section size="sm">
        <div className="container-page grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-fg">পেশাদারদের প্রশ্ন</h2>
            <p className="text-base text-fg-secondary">
              আরও জানতে চাইলে আমাদের সাথে কথা বলুন।
            </p>
            <Button asChild variant="secondary" className="w-fit">
              <Link href="/contact">যোগাযোগ করুন</Link>
            </Button>
          </div>
          <FaqAccordion items={FAQS} />
        </div>
      </Section>
    </>
  );
}
