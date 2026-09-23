import { Section, SectionHeader } from "@/components/marketing/section";
import { toBn } from "@/lib/format";

const STEPS = [
  {
    title: "আপনার প্রয়োজন জানান",
    body: "কী কাজ করাতে চান আর কোন এলাকায় — সংক্ষেপে লিখে দিন।",
  },
  {
    title: "আমরা পেশাদার ঠিক করি",
    body: "ঘরলি টিম উপযুক্ত যাচাইকৃত পেশাদার ঠিক করে দাম জানিয়ে কোটেশন পাঠাবে।",
  },
  {
    title: "নিশ্চিন্তে বুক করুন",
    body: "কোটেশন গ্রহণ করুন, নির্ধারিত সময়ে কাজ বুঝে নিন।",
  },
];

export function HowItWorks() {
  return (
    <Section tone="muted" id="how-it-works">
      <div className="container-page flex flex-col gap-12">
        <SectionHeader
          eyebrow="কীভাবে কাজ করে"
          title="তিন ধাপে সমাধান"
          description="খোঁজাখুঁজি নয়, ফোন ঘোরানো নয় — সোজা কাজের মানুষ পর্যন্ত।"
          align="center"
        />

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          {/* The connecting line, desktop only. Sits behind the numbered discs. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-7 hidden h-px bg-border md:block"
          />

          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col gap-4 md:items-center md:text-center">
              <span className="grid size-14 shrink-0 place-items-center rounded-full border border-border bg-surface text-xl font-extrabold tabular text-teal-700 shadow-sm">
                <span className="-translate-y-px">{toBn(String(i + 1).padStart(2, "0"))}</span>
              </span>
              <div className="flex flex-col gap-2 md:max-w-xs">
                <h3 className="text-xl font-semibold text-fg">{step.title}</h3>
                <p className="text-base text-fg-secondary">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
