import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Section, SectionHeader } from "@/components/marketing/section";
import { CategoryIcon } from "@/components/domain/category-icon";
import { ProviderCard } from "@/components/domain/provider-card";
import { AreaChip } from "@/components/domain/area-chip";
import { ServiceCard } from "@/components/domain/service-card";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CATEGORIES, CATEGORY_BY_SLUG } from "@/lib/data/categories";
import { PROVIDERS } from "@/lib/data/providers";
import { AREAS } from "@/lib/data/areas";
import { formatBdtRange, formatCount, formatDuration } from "@/lib/format";
import {
  pageMetadata,
  JsonLd,
  serviceJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";
import { ACTIONS } from "@/lib/strings";

/** All 14 categories prerender — these are the SEO landing pages. */
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG[slug];
  if (!category) return {};

  return pageMetadata({
    title: `${category.bnName} — চট্টগ্রাম`,
    description: `${category.bnDescription} চট্টগ্রামে ${category.bnShortName}-এর যাচাইকৃত পেশাদার খুঁজুন।`,
    path: `/services/${category.slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const category = CATEGORY_BY_SLUG[slug];
  if (!category) notFound();

  const providers = PROVIDERS.filter((p) =>
    p.categoryIds.includes(category._id),
  ).sort((a, b) => b.rating - a.rating);

  const related = CATEGORIES.filter(
    (c) => c._id !== category._id && c.tint === category.tint,
  ).slice(0, 4);

  const crumbs = [
    { label: "হোম", href: "/" },
    { label: "সেবাসমূহ", href: "/services" },
    { label: category.bnShortName, href: `/services/${category.slug}` },
  ];

  const facts = [
    {
      icon: Wallet,
      label: "সাধারণ খরচ",
      value: formatBdtRange(category.priceFrom, category.priceTo),
    },
    {
      icon: Clock,
      label: "গড় সময়",
      value: formatDuration(category.avgDurationMinutes),
    },
    {
      icon: Check,
      label: "সম্পন্ন কাজ",
      value: formatCount(category.jobCount),
    },
  ];

  return (
    <>
      <JsonLd data={serviceJsonLd(category)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      {/* ---------- header ---------- */}
      <div className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-7 py-10 md:py-14">
          <Breadcrumb items={crumbs} />

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex max-w-2xl gap-5">
              <CategoryIcon
                icon={category.icon}
                tint={category.tint}
                size="xl"
                className="hidden sm:grid"
              />
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-extrabold text-fg md:text-4xl">
                  {category.bnName}
                </h1>
                <p className="text-lg text-fg-secondary">{category.bnDescription}</p>
              </div>
            </div>

            <Button asChild size="lg" className="shrink-0">
              <Link href={`/customer/request?category=${category.slug}`}>
                {ACTIONS.requestService}
              </Link>
            </Button>
          </div>

          <dl className="grid gap-4 border-t border-border-subtle pt-6 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-fg-tertiary">
                  <Icon aria-hidden="true" className="size-4.5" />
                </span>
                <span className="flex flex-col">
                  <dt className="text-xs text-fg-tertiary">{label}</dt>
                  <dd className="text-base font-semibold tabular text-fg">{value}</dd>
                </span>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ---------- sub-services ---------- */}
      <Section size="sm">
        <div className="container-page flex flex-col gap-8">
          <SectionHeader
            title={`${category.bnShortName}-এ যেসব কাজ করা হয়`}
            description="তালিকার বাইরের কাজও হতে পারে — অনুরোধে লিখে জানান।"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.subServices.map((service) => (
              <li
                key={service}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5"
              >
                <Check
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="size-4 shrink-0 text-teal-600"
                />
                <span className="text-base text-fg">{service}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- providers ---------- */}
      <Section tone="muted" size="sm">
        <div className="container-page flex flex-col gap-8">
          <SectionHeader
            title={`${category.bnShortName}-এর পেশাদারগণ`}
            description={`চট্টগ্রামে ${formatCount(providers.length, "পেশাদার")} এই সেবা দিচ্ছেন।`}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard key={provider._id} provider={provider} />
            ))}
          </div>
        </div>
      </Section>

      {/* ---------- areas ---------- */}
      <Section size="sm">
        <div className="container-page flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-fg">
            {category.bnShortName} — এলাকা অনুযায়ী
          </h2>
          <ul className="flex flex-wrap gap-2.5">
            {AREAS.map((area) => (
              <li key={area._id}>
                <AreaChip
                  area={area}
                  href={`/services/${category.slug}?area=${area.slug}`}
                />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <HowItWorks />

      {related.length > 0 && (
        <Section size="sm">
          <div className="container-page flex flex-col gap-8">
            <SectionHeader
              title="সম্পর্কিত সেবা"
              action={
                <Button asChild variant="secondary">
                  <Link href="/services">
                    {ACTIONS.viewAll}
                    <ArrowLeft aria-hidden="true" className="rotate-180" />
                  </Link>
                </Button>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((c) => (
                <ServiceCard key={c._id} category={c} />
              ))}
            </div>
          </div>
        </Section>
      )}
    </>
  );
}
