import type { Metadata } from "next";
import { BRAND } from "@/lib/strings";
import type { Category, Provider } from "@/lib/types";
import { AREA_BY_ID } from "@/lib/data/areas";

const SITE_URL = "https://ghorly.com";

/**
 * One builder so every marketing page gets the same metadata shape —
 * canonical, Open Graph and Twitter card — without repeating the boilerplate
 * fourteen times.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      siteName: BRAND.bnName,
      url: `${SITE_URL}${path}`,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* ==========================================================================
   Structured data
   ========================================================================== */

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND.bnName,
    alternateName: BRAND.wordmark,
    description: BRAND.supporting,
    url: SITE_URL,
    areaServed: { "@type": "City", name: BRAND.city, addressCountry: "BD" },
    address: {
      "@type": "PostalAddress",
      addressLocality: BRAND.city,
      addressCountry: "BD",
    },
    priceRange: "৳৪৫০–৳২৫,০০০",
  };
}

export function serviceJsonLd(category: Category) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: category.bnName,
    description: category.bnDescription,
    serviceType: category.bnName,
    provider: { "@type": "LocalBusiness", name: BRAND.bnName, url: SITE_URL },
    areaServed: { "@type": "City", name: BRAND.city, addressCountry: "BD" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: category.priceFrom,
      highPrice: category.priceTo,
    },
    url: `${SITE_URL}/services/${category.slug}`,
  };
}

export function providerJsonLd(provider: Provider) {
  const area = AREA_BY_ID[provider.areaId];
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.bnName,
    description: provider.bnBio,
    url: `${SITE_URL}/providers/${provider.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: area?.bnName,
      addressRegion: BRAND.city,
      addressCountry: "BD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: provider.rating,
      reviewCount: provider.reviewCount,
      bestRating: 5,
    },
    priceRange: `৳${provider.priceFrom}+`,
  };
}

export function breadcrumbJsonLd(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

/** Renders a JSON-LD script tag. Server components only. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
