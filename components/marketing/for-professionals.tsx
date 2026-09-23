import Link from "next/link";
import { CalendarCheck, Star, TrendingUp, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/marketing/section";
import { formatBdt, formatCount, formatPercent, toBn } from "@/lib/format";
import { ACTIONS } from "@/lib/strings";

const BENEFITS = [
  { icon: Users, title: "নতুন গ্রাহক পান", body: "আপনার এলাকার কাজের অনুরোধ সরাসরি আপনার কাছে আসবে।" },
  { icon: CalendarCheck, title: "কাজ গুছিয়ে রাখুন", body: "কোন দিন কোথায় কাজ — সব এক জায়গায়।" },
  { icon: Star, title: "সুনাম গড়ুন", body: "প্রতিটি ভালো কাজ আপনার রেটিং বাড়াবে।" },
  { icon: Wallet, title: "আয়ের হিসাব রাখুন", body: "কত আয় হলো, কত বাকি — পরিষ্কার হিসাব।" },
];

export function ForProfessionals() {
  return (
    <Section tone="inverse" id="for-professionals">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-teal-300">পেশাদারদের জন্য</span>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              ঘরলির সাথে আপনার সেবা ব্যবসা বাড়ান
            </h2>
            <p className="max-w-xl text-lg text-ink-300">
              চট্টগ্রামের শত শত ঘর প্রতিদিন দক্ষ হাতের খোঁজ করছে। আপনার কাজ যেন
              তাঁদের চোখে পড়ে।
            </p>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-teal-300">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-4.5" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-white">{title}</span>
                  <span className="text-sm text-ink-400">{body}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register/provider">{ACTIONS.becomeProfessional}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/for-professionals">{ACTIONS.learnMore}</Link>
            </Button>
          </div>
        </div>

        {/* Earnings panel — a miniature of the provider dashboard. */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-ink-400">এই মাসের আয়</span>
            <span className="flex items-center gap-1 text-sm font-medium text-teal-300">
              <TrendingUp aria-hidden="true" className="size-4" />
              <span className="tabular">{formatPercent(18, true)}</span>
            </span>
          </div>
          <p className="mt-2 text-4xl font-extrabold tabular text-white">
            {formatBdt(84500)}
          </p>

          <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-6">
            {[
              { label: "সম্পন্ন কাজ", value: formatCount(23) },
              { label: "নতুন অনুরোধ", value: formatCount(7) },
              { label: "গড় রেটিং", value: `${toBn("4.8")} / ${toBn(5)}` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink-400">{row.label}</span>
                <span className="text-base font-semibold tabular text-white">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Deliberately abstract bar row — a real chart lives in the dashboard. */}
          <div className="mt-7 flex items-end gap-1.5" aria-hidden="true">
            {[38, 52, 44, 67, 58, 79, 71, 88, 74, 92, 83, 100].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-teal-400/70"
                style={{ height: `${h * 0.6}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
