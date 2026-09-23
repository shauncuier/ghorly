import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Section } from "@/components/marketing/section";
import { ContactForm } from "@/components/marketing/contact-form";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { pageMetadata } from "@/lib/seo";
import { formatPhone } from "@/lib/format";
import { BRAND } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: "যোগাযোগ",
  description:
    "ঘরলির সাথে যোগাযোগ করুন — সেবা, পেশাদার নিবন্ধন, অভিযোগ বা অংশীদারিত্ব নিয়ে যেকোনো প্রশ্নে।",
  path: "/contact",
});

const HELP_FAQS = [
  {
    q: "বুকিং বাতিল করব কীভাবে?",
    a: "আপনার বুকিংয়ের পাতায় গিয়ে 'বাতিল করুন' চাপুন। নির্ধারিত সময়ের ২৪ ঘণ্টা আগে বাতিল করলে কোনো চার্জ নেই।",
  },
  {
    q: "পেশাদার সময়মতো না এলে?",
    a: "বুকিংয়ের পাতা থেকে সরাসরি বার্তা পাঠান। উত্তর না পেলে আমাদের জানান, আমরা বিকল্প পেশাদার খুঁজে দেব।",
  },
  {
    q: "কাজ নিয়ে অভিযোগ জানাব কীভাবে?",
    a: "সম্পন্ন বুকিংয়ের পাতায় 'অভিযোগ জানান' বিকল্প আছে। আমাদের দল দুই পক্ষের কথা শুনে সাত দিনের মধ্যে নিষ্পত্তি করে।",
  },
  {
    q: "আমার তথ্য পরিবর্তন করব কীভাবে?",
    a: "সেটিংস পাতা থেকে নাম, ফোন নম্বর ও ঠিকানা যেকোনো সময় বদলাতে পারবেন।",
  },
];

const CHANNELS = [
  { icon: Phone, label: "ফোন", value: formatPhone("01800000000"), note: "সকাল ৯টা – রাত ৯টা" },
  { icon: Mail, label: "ইমেইল", value: "hello@ghorly.com", note: "২৪ ঘণ্টার মধ্যে উত্তর", latin: true },
  { icon: MapPin, label: "ঠিকানা", value: `${BRAND.city}, বাংলাদেশ`, note: "জিইসি মোড়" },
  { icon: Clock, label: "সেবার সময়", value: "প্রতিদিন", note: "সকাল ৮টা – রাত ৮টা" },
];

export default function ContactPage() {
  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-6 py-10 md:py-14">
          <Breadcrumb
            items={[
              { label: "হোম", href: "/" },
              { label: "যোগাযোগ", href: "/contact" },
            ]}
          />
          <div className="flex max-w-2xl flex-col gap-3">
            <h1 className="text-4xl font-extrabold text-fg md:text-5xl">
              আমাদের সাথে কথা বলুন
            </h1>
            <p className="text-lg text-fg-secondary">
              প্রশ্ন, পরামর্শ বা অভিযোগ — যা-ই হোক, আমরা শুনছি।
            </p>
          </div>
        </div>
      </div>

      <Section size="sm">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-fg">বার্তা পাঠান</h2>
            <ContactForm />
          </div>

          <aside className="flex h-fit flex-col gap-5 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-fg">সরাসরি যোগাযোগ</h2>
            <ul className="flex flex-col gap-5">
              {CHANNELS.map(({ icon: Icon, label, value, note, latin }) => (
                <li key={label} className="flex gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-fg-tertiary">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs text-fg-tertiary">{label}</span>
                    <span
                      className={
                        latin
                          ? "font-latin text-sm font-medium text-fg"
                          : "text-sm font-medium tabular text-fg"
                      }
                      lang={latin ? "en" : undefined}
                    >
                      {value}
                    </span>
                    <span className="text-xs text-fg-tertiary">{note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      <Section tone="muted" size="sm" id="help">
        <div className="container-page grid scroll-mt-24 gap-10 lg:grid-cols-[20rem_1fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-fg">সহায়তা কেন্দ্র</h2>
            <p className="text-base text-fg-secondary">
              সবচেয়ে বেশি যেসব প্রশ্ন আসে।
            </p>
          </div>
          <FaqAccordion items={HELP_FAQS} />
        </div>
      </Section>
    </>
  );
}
