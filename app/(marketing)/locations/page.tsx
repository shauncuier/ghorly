import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Section, SectionHeader } from "@/components/marketing/section";
import { ChattogramMap } from "@/components/marketing/chattogram-map";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AREAS } from "@/lib/data/areas";
import { formatCount } from "@/lib/format";
import { pageMetadata, JsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "এলাকাসমূহ",
  description:
    "চট্টগ্রামের ১৪টি এলাকায় ঘরলির যাচাইকৃত পেশাদার — পাঁচলাইশ, খুলশী, জিইসি, আগ্রাবাদ, নাসিরাবাদ, হালিশহর ও মুরাদপুরসহ।",
  path: "/locations",
});

const CRUMBS = [
  { label: "হোম", href: "/" },
  { label: "এলাকাসমূহ", href: "/locations" },
];

export default function LocationsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="border-b border-border bg-surface">
        <div className="container-page flex flex-col gap-6 py-10 md:py-14">
          <Breadcrumb items={CRUMBS} />
          <div className="flex max-w-2xl flex-col gap-3">
            <h1 className="text-4xl font-extrabold text-fg md:text-5xl">
              চট্টগ্রামের যে এলাকায় আমরা আছি
            </h1>
            <p className="text-lg text-fg-secondary">
              শহরের ১৪টি এলাকায় যাচাইকৃত পেশাদাররা কাজ করছেন। আপনার পাড়া বেছে নিন।
            </p>
          </div>
        </div>
      </div>

      <ChattogramMap />

      <Section size="sm">
        <div className="container-page flex flex-col gap-8">
          <SectionHeader title="সব এলাকা" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {AREAS.map((area) => (
              <li key={area._id}>
                <Link
                  href={`/locations/${area.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-[border-color,box-shadow,transform] duration-(--duration-base) hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                    <MapPin aria-hidden="true" className="size-4.5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base font-semibold text-fg">{area.bnName}</span>
                    <span className="text-sm tabular text-fg-tertiary">
                      {formatCount(area.providerCount, "পেশাদার")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
