import { notFound } from "next/navigation";
import Link from "next/link";
import { BriefcaseBusiness, CalendarCheck, Clock, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { LiveVerifiedBadge } from "@/components/domain/live-verified-badge";
import { CategoryIcon } from "@/components/domain/category-icon";
import { PhotoPlaceholder } from "@/components/domain/photo-placeholder";
import { ReviewCard } from "@/components/domain/review-card";
import { ReviewSummary } from "@/components/domain/review-summary";
import { AreaChip } from "@/components/domain/area-chip";
import { ProviderCard } from "@/components/domain/provider-card";
import { BookingPanel } from "@/components/marketing/booking-panel";
import { Section } from "@/components/marketing/section";
import { PROVIDERS, PROVIDER_BY_SLUG } from "@/lib/data/providers";
import { CATEGORY_BY_ID } from "@/lib/data/categories";
import { AREA_BY_ID } from "@/lib/data/areas";
import { CUSTOMER_BY_ID } from "@/lib/data/customers";
import { ratingBreakdown, reviewsForProvider } from "@/lib/data/reviews";
import { formatBdt, formatCount, formatDate, formatDuration } from "@/lib/format";
import { pageMetadata, JsonLd, providerJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { COMMON, SLOT_LABEL } from "@/lib/strings";
import { WEEKDAYS_LONG } from "@/lib/format";

export function generateStaticParams() {
  return PROVIDERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/providers/[slug]">) {
  const { slug } = await params;
  const provider = PROVIDER_BY_SLUG[slug];
  if (!provider) return {};
  const area = AREA_BY_ID[provider.areaId];

  return pageMetadata({
    title: `${provider.bnName} — ${provider.bnTitle}`,
    description: `${area?.bnName}, চট্টগ্রামের ${provider.bnTitle}। ${formatCount(provider.completedJobs, "কাজ সম্পন্ন")}, রেটিং ${provider.rating}।`,
    path: `/providers/${provider.slug}`,
  });
}

export default async function ProviderProfilePage({
  params,
}: PageProps<"/providers/[slug]">) {
  const { slug } = await params;
  const provider = PROVIDER_BY_SLUG[slug];
  if (!provider) notFound();

  const area = AREA_BY_ID[provider.areaId];
  const categories = provider.categoryIds.map((id) => CATEGORY_BY_ID[id]).filter(Boolean);
  const reviews = reviewsForProvider(provider._id);
  const breakdown = ratingBreakdown(provider._id);

  const similar = PROVIDERS.filter(
    (p) =>
      p._id !== provider._id &&
      p.categoryIds.some((c) => provider.categoryIds.includes(c)),
  ).slice(0, 3);

  const crumbs = [
    { label: "হোম", href: "/" },
    { label: "সেবাসমূহ", href: "/services" },
    { label: provider.bnName, href: `/providers/${provider.slug}` },
  ];

  const stats = [
    { icon: BriefcaseBusiness, label: COMMON.completedJobs, value: formatCount(provider.completedJobs) },
    { icon: CalendarCheck, label: COMMON.experience, value: `${formatCount(provider.experienceYears)} ${COMMON.years}` },
    { icon: Clock, label: COMMON.responseTime, value: formatDuration(provider.responseMinutes) },
    { icon: MapPin, label: COMMON.serviceArea, value: area?.bnName ?? "" },
  ];

  return (
    <>
      <JsonLd data={providerJsonLd(provider)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      {/* ---------- header ---------- */}
      <div className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-7 py-8 md:py-12">
          <Breadcrumb items={crumbs} />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              id={provider._id}
              name={provider.bnName}
              size="2xl"
              className="shrink-0"
            />

            <div className="flex flex-col gap-3">
              <LiveVerifiedBadge
                providerId={provider._id}
                fallback={provider.isVerified}
                size="lg"
              />
              <h1 className="text-3xl font-extrabold text-fg md:text-4xl">
                {provider.bnName}
              </h1>
              <p className="text-lg text-fg-secondary">{provider.bnTitle}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Rating
                  value={provider.rating}
                  reviewCount={provider.reviewCount}
                  size="md"
                />
                <span className="text-sm text-fg-tertiary">·</span>
                <span className="flex items-center gap-1.5 text-sm text-fg-secondary">
                  <MapPin aria-hidden="true" className="size-4" />
                  {area?.bnName}, চট্টগ্রাম
                </span>
              </div>

              {provider.bnBadges.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {provider.bnBadges.map((badge) => (
                    <li key={badge}>
                      <Badge tone="accent" variant="outline">
                        {badge}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- body ---------- */}
      <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <div className="flex flex-col gap-10">
          {/* stats */}
          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-4">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <dt className="flex items-center gap-1.5 text-xs text-fg-tertiary">
                  <Icon aria-hidden="true" className="size-3.5" />
                  {label}
                </dt>
                <dd className="text-base font-semibold tabular text-fg">{value}</dd>
              </div>
            ))}
          </dl>

          {/* about */}
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-fg">পরিচিতি</h2>
            <p className="text-base text-fg-secondary">{provider.bnBio}</p>
            <p className="text-sm text-fg-tertiary">
              ঘরলিতে যুক্ত হয়েছেন {formatDate(provider.joinedAt, "monthYear")}-এ।
            </p>
          </section>

          <Separator />

          {/* services */}
          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-fg">যেসব সেবা দেন</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={`/services/${category.slug}`}
                    className="flex items-center gap-3.5 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-(--duration-fast) hover:border-border-strong hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  >
                    <CategoryIcon icon={category.icon} tint={category.tint} size="md" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base font-medium text-fg">
                        {category.bnShortName}
                      </span>
                      <span className="text-sm tabular text-fg-tertiary">
                        {COMMON.startingFrom}{" "}
                        {formatBdt(
                          provider.categoryPricing[category._id] ?? provider.priceFrom,
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          {/* portfolio */}
          {provider.portfolio.length > 0 && (
            <>
              <section className="flex flex-col gap-5">
                <h2 className="text-2xl font-bold text-fg">সাম্প্রতিক কাজ</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {provider.portfolio.map((item) => (
                    <PhotoPlaceholder
                      key={item.id}
                      id={item.id}
                      categoryId={item.categoryId}
                      caption={item.bnCaption}
                    />
                  ))}
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* service area */}
          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-fg">{COMMON.serviceArea}</h2>
            <ul className="flex flex-wrap gap-2.5">
              {provider.serviceAreaIds.map((id) => {
                const a = AREA_BY_ID[id];
                return a ? (
                  <li key={id}>
                    <AreaChip area={a} />
                  </li>
                ) : null;
              })}
            </ul>
          </section>

          <Separator />

          {/* availability */}
          <section className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-fg">সাপ্তাহিক সময়সূচি</h2>
            <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border bg-surface">
              {WEEKDAYS_LONG.map((dayName, i) => {
                const slots = provider.availability[i] ?? [];
                return (
                  <li
                    key={dayName}
                    className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                  >
                    <span className="text-sm font-medium text-fg">{dayName}</span>
                    {slots.length === 0 ? (
                      <span className="text-sm text-fg-disabled">বন্ধ</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        {slots.map((key) => (
                          <Badge key={key} tone="neutral" size="sm">
                            {SLOT_LABEL[key] ?? key}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <Separator />

          {/* reviews */}
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-fg">
              রিভিউ ও রেটিং
            </h2>
            <ReviewSummary
              rating={provider.rating}
              reviewCount={provider.reviewCount}
              breakdown={breakdown}
              className="rounded-xl border border-border bg-surface p-6"
            />
            <div className="flex flex-col">
              {reviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  authorName={CUSTOMER_BY_ID[review.customerId]?.bnName ?? "গ্রাহক"}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ---------- sticky booking rail ---------- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <BookingPanel provider={provider} />
        </aside>
      </div>

      {similar.length > 0 && (
        <Section tone="muted" size="sm">
          <div className="container-page flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-fg">একই ধরনের পেশাদার</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {similar.map((p) => (
                <ProviderCard key={p._id} provider={p} />
              ))}
            </div>
          </div>
        </Section>
      )}
    </>
  );
}
