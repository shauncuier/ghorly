import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Section, SectionHeader } from "@/components/marketing/section";
import { ProviderCard } from "@/components/domain/provider-card";
import { ServiceCard } from "@/components/domain/service-card";
import { AreaChip } from "@/components/domain/area-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { AREAS, AREA_BY_SLUG } from "@/lib/data/areas";
import { PROVIDERS } from "@/lib/data/providers";
import { CATEGORIES } from "@/lib/data/categories";
import { formatCount } from "@/lib/format";
import { pageMetadata, JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { ACTIONS, EMPTY } from "@/lib/strings";

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/locations/[area]">) {
  const { area: slug } = await params;
  const area = AREA_BY_SLUG[slug];
  if (!area) return {};

  return pageMetadata({
    title: `${area.bnName}, চট্টগ্রাম — ঘরের সেবা`,
    description: `${area.bnName}-এ ${formatCount(area.providerCount, "যাচাইকৃত পেশাদার")}। প্লাম্বিং, ইলেকট্রিক্যাল, এসি, পরিষ্কার ও আরও সেবা।`,
    path: `/locations/${area.slug}`,
  });
}

export default async function AreaPage({ params }: PageProps<"/locations/[area]">) {
  const { area: slug } = await params;
  const area = AREA_BY_SLUG[slug];
  if (!area) notFound();

  const providers = PROVIDERS.filter(
    (p) => p.areaId === area._id || p.serviceAreaIds.includes(area._id),
  ).sort((a, b) => b.rating - a.rating);

  // Categories actually covered by someone serving this area.
  const coveredIds = new Set(providers.flatMap((p) => p.categoryIds));
  const covered = CATEGORIES.filter((c) => coveredIds.has(c._id));

  const nearby = AREAS.filter((a) => a._id !== area._id).slice(0, 6);

  const crumbs = [
    { label: "হোম", href: "/" },
    { label: "এলাকাসমূহ", href: "/locations" },
    { label: area.bnName, href: `/locations/${area.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <div className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-6 py-10 md:py-14">
          <Breadcrumb items={crumbs} />
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-2xl gap-4">
              <span className="hidden size-14 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 sm:grid">
                <MapPin aria-hidden="true" className="size-6" />
              </span>
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-extrabold text-fg md:text-4xl">
                  {area.bnName}-এ ঘরের সেবা
                </h1>
                <p className="text-lg text-fg-secondary">
                  {area.bnName} ও আশেপাশে{" "}
                  {formatCount(providers.length, "যাচাইকৃত পেশাদার")} কাজ করছেন।
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={`/customer/request?area=${area.slug}`}>
                {ACTIONS.requestService}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Section size="sm">
        <div className="container-page flex flex-col gap-8">
          <SectionHeader title={`${area.bnName}-এ উপলব্ধ সেবা`} />
          {covered.length === 0 ? (
            <EmptyState {...EMPTY.searchResults} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {covered.map((category) => (
                <ServiceCard key={category._id} category={category} />
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section tone="muted" size="sm">
        <div className="container-page flex flex-col gap-8">
          <SectionHeader
            title={`${area.bnName}-এর পেশাদারগণ`}
            description="রেটিং অনুযায়ী সাজানো।"
          />
          {providers.length === 0 ? (
            <EmptyState
              {...EMPTY.searchResults}
              cta={ACTIONS.viewAll}
              href="/services"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {providers.map((provider) => (
                <ProviderCard key={provider._id} provider={provider} />
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section size="sm">
        <div className="container-page flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-fg">আশেপাশের এলাকা</h2>
          <ul className="flex flex-wrap gap-2.5">
            {nearby.map((a) => (
              <li key={a._id}>
                <AreaChip area={a} href={`/locations/${a.slug}`} showCount />
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
