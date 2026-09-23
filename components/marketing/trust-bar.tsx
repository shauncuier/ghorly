import { BadgeCheck, Clock, ShieldCheck, Star } from "lucide-react";
import { formatCountPlus, formatRating, toBn } from "@/lib/format";
import { BRAND } from "@/lib/strings";

const METRICS = [
  { value: formatCountPlus(500), label: "পেশাদার" },
  { value: formatCountPlus(2000), label: "কাজ সম্পন্ন" },
  { value: `${formatRating(4.8)}/${toBn(5)}`, label: "গড় রেটিং" },
  { value: `${toBn(14)}টি`, label: "সেবার ধরন" },
];

const ASSURANCES = [
  { icon: BadgeCheck, label: "যাচাইকৃত পেশাদার" },
  { icon: Star, label: "পাঁচ তারকা সেবা" },
  { icon: Clock, label: "দ্রুত সাড়া" },
  { icon: ShieldCheck, label: "নিরাপদ বুকিং" },
];

export function TrustBar() {
  return (
    <section className="border-b border-border bg-surface-muted py-10 md:py-12">
      <div className="container-page flex flex-col gap-8">
        <p className="text-center text-sm text-fg-tertiary">
          {BRAND.city}-এর ঘরে ঘরে বিশ্বস্ত
        </p>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-1 text-center">
              <dt className="sr-only">{m.label}</dt>
              <dd className="text-3xl font-extrabold tabular text-fg md:text-4xl">
                {m.value}
              </dd>
              <dd className="text-sm text-fg-secondary">{m.label}</dd>
            </div>
          ))}
        </dl>

        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border pt-7">
          {ASSURANCES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-sm text-fg-secondary">
              <Icon aria-hidden="true" className="size-4 shrink-0 text-teal-600" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
