import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { ServiceCard } from "@/components/domain/service-card";
import { ProviderCard } from "@/components/domain/provider-card";
import { AreaChip } from "@/components/domain/area-chip";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CATEGORIES } from "@/lib/data/categories";
import { AREAS } from "@/lib/data/areas";
import { PROVIDERS } from "@/lib/data/providers";
import { pageMetadata, JsonLd, localBusinessJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { ACTIONS } from "@/lib/strings";

export const metadata: Metadata = pageMetadata({
  title: "সব সেবা",
  description:
    "চট্টগ্রামে ঘরলির ১৪টি সেবার ধরন — প্লাম্বিং, ইলেকট্রিক্যাল, এসি, পরিষ্কার, রঙ, কাঠের কাজ ও আরও অনেক কিছু।",
  path: "/services",
});

const CRUMBS = [
  { label: "হোম", href: "/" },
  { label: "সেবাসমূহ", href: "/services" },
];

/** Top-rated across every category — the "who's good right now" rail. */
const TOP_PROVIDERS = [...PROVIDERS]
  .filter((p) => p.isVerified)
  .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
  .slice(0, 6);

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-6 py-10 md:py-14">
          <Breadcrumb items={CRUMBS} />
          <div className="flex max-w-2xl flex-col gap-3">
            <h1 className="text-4xl font-extrabold text-fg md:text-5xl">
              ঘরের সব সেবা, এক জায়গায়
            </h1>
            <p className="text-lg text-fg-secondary">
              চট্টগ্রামজুড়ে ১৪টি ধরনের সেবা। যে কাজটি দরকার সেটি বেছে নিন,
              আমরা উপযুক্ত পেশাদার দেখাব।
            </p>
          </div>
        </div>
      </div>

      <Section size="sm">
        <div className="container-page flex flex-col gap-8">
          <h2 className="text-2xl font-bold text-fg">সেবার ধরন</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CATEGORIES.map((category) => (
              <ServiceCard key={category._id} category={category} />
            ))}
          </div>
        </div>
      </Section>

      <Section tone="muted" size="sm">
        <div className="container-page flex flex-col gap-8">
          <SectionHeader
            title="এলাকা অনুযায়ী খুঁজুন"
            description="আপনার পাড়ার কাছেই কাজের মানুষ।"
          />
          <ul className="flex flex-wrap gap-2.5">
            {AREAS.map((area) => (
              <li key={area._id}>
                <AreaChip area={area} href={`/locations/${area.slug}`} showCount />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section size="sm">
        <div className="container-page flex flex-col gap-8">
          <SectionHeader
            title="সবচেয়ে বেশি প্রশংসিত পেশাদার"
            description="রেটিং ও রিভিউয়ের সংখ্যা — দুটোই বিবেচনা করে বাছাই করা।"
            action={
              <Button asChild variant="secondary">
                <Link href="/customer/request">
                  {ACTIONS.requestService}
                  <ArrowLeft aria-hidden="true" className="rotate-180" />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {TOP_PROVIDERS.map((provider) => (
              <ProviderCard key={provider._id} provider={provider} />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
