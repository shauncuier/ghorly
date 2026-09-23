import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Rating } from "@/components/ui/rating";
import { PriceDisplay } from "@/components/ui/price-display";
import { Progress } from "@/components/ui/progress";
import { Stepper } from "@/components/ui/stepper";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/components/domain/category-icon";
import { VerifiedBadge } from "@/components/domain/verified-badge";
import { ServiceCard } from "@/components/domain/service-card";
import { ProviderCard } from "@/components/domain/provider-card";
import {
  ProviderCardSkeleton,
  ServiceCardSkeleton,
  BookingCardSkeleton,
  ReviewSkeleton,
} from "@/components/skeletons";
import { AreaChart, BarChart, DonutChart, Sparkline } from "@/components/charts";
import { CATEGORIES } from "@/lib/data/categories";
import { PROVIDERS } from "@/lib/data/providers";
import { ADMIN_METRICS } from "@/lib/data/admin-metrics";
import { formatBdt, formatCount, formatRating } from "@/lib/format";
import { STATUS } from "@/lib/strings";

/**
 * Design-system gallery.
 *
 * Kept maintained rather than abandoned: it is the thirty-second way to review
 * every primitive at any width, and the fastest place to catch a Bangla
 * clipping or leading regression. `noindex`, and excluded from the sitemap.
 */
export const metadata: Metadata = {
  title: "ডিজাইন সিস্টেম",
  robots: { index: false, follow: false },
};

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 border-t border-border py-8">
      <h2 className="text-xl font-bold text-fg">{title}</h2>
      {/* min-w-0 on the row: flex items default to min-width:auto, so a child
          with a wide intrinsic size would otherwise push the whole page. */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

const TYPE_STEPS = [
  ["text-6xl font-extrabold", "6xl / 800", "আপনার ঘরের জন্য"],
  ["text-5xl font-extrabold", "5xl / 800", "বিশ্বস্ত সেবা"],
  ["text-4xl font-bold", "4xl / 700", "ঘরের প্রতিটি কাজের জন্য"],
  ["text-3xl font-bold", "3xl / 700", "যাচাইকৃত পেশাদার খুঁজুন"],
  ["text-2xl font-semibold", "2xl / 600", "শীতাতপ নিয়ন্ত্রণ বিশেষজ্ঞ"],
  ["text-xl font-semibold", "xl / 600", "বৈদ্যুতিক মেরামত ও রক্ষণাবেক্ষণ"],
  ["text-lg font-medium", "lg / 500", "পাঁচলাইশ, খুলশী ও নাসিরাবাদ"],
  ["text-base", "base / 400", "কৃষ্ণচূড়া গাছের ছায়ায় দাঁড়িয়ে রইল ক্ষুদ্র বৃদ্ধ।"],
  ["text-sm", "sm / 400", "সম্পন্ন কাজের সংখ্যা ও গড় রেটিং দেখুন।"],
  ["text-xs", "xs / 400 · ১৩px", "সর্বনিম্ন পাঠযোগ্য আকার — যুক্তাক্ষর স্পষ্ট থাকে।"],
] as const;

export default function KitchenSinkPage() {
  return (
    <div className="container-page flex flex-col py-12">
      <header className="flex flex-col gap-3 pb-8">
        <h1 className="text-4xl font-extrabold text-fg">ডিজাইন সিস্টেম</h1>
        <p className="max-w-2xl text-lg text-fg-secondary">
          ঘরলির সব উপাদান এক পাতায় — যেকোনো প্রস্থে যাচাই করার জন্য।
        </p>
      </header>

      <Row title="টাইপ স্কেল">
        <div className="flex w-full flex-col gap-5">
          {TYPE_STEPS.map(([cls, name, sample]) => (
            <div key={name} className="flex flex-col gap-1">
              <span className="font-latin text-xs text-fg-tertiary">{name}</span>
              <p className={cls}>{sample}</p>
            </div>
          ))}
        </div>
      </Row>

      <Row title="বোতাম">
        {(["primary", "secondary", "subtle", "ghost", "danger", "inverse"] as const).map(
          (v) => (
            <Button key={v} variant={v}>
              {v === "primary" ? "সেবা খুঁজুন" : "বোতাম"}
            </Button>
          ),
        )}
        <Button loading>লোড হচ্ছে</Button>
        <Button disabled>নিষ্ক্রিয়</Button>
        <Button size="sm">ছোট</Button>
        <Button size="lg">বড়</Button>
        <Button>
          <Wrench aria-hidden="true" />
          আইকনসহ
        </Button>
      </Row>

      <Row title="ব্যাজ ও স্ট্যাটাস">
        {(["neutral", "accent", "success", "warning", "danger"] as const).map((t) => (
          <Badge key={t} tone={t}>
            {t === "accent" ? "যাচাইকৃত" : "ব্যাজ"}
          </Badge>
        ))}
        <VerifiedBadge />
        <div className="flex w-full flex-col gap-3 pt-2">
          {(
            ["request", "quote", "booking", "payment", "verification", "dispute"] as const
          ).map((domain) => (
            <div key={domain} className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 font-latin text-xs text-fg-tertiary">
                {domain}
              </span>
              {Object.keys(STATUS[domain]).map((status) => (
                <StatusBadge
                  key={status}
                  domain={domain}
                  // Keys come from the registry itself, so this is exhaustive by construction.
                  status={status as never}
                />
              ))}
            </div>
          ))}
        </div>
      </Row>

      <Row title="ফর্ম">
        <div className="grid w-full gap-4 md:grid-cols-2">
          <Input placeholder="সাধারণ ইনপুট" />
          <Input placeholder="ত্রুটিযুক্ত" invalid />
          <Input placeholder="নিষ্ক্রিয়" disabled />
          <Textarea placeholder="বিস্তারিত লিখুন…" rows={3} />
        </div>
      </Row>

      <Row title="রেটিং, দাম ও অগ্রগতি">
        <Rating value={4.9} reviewCount={118} />
        <Rating value={3.6} size="sm" />
        <Rating value={4.2} compact />
        <Separator orientation="vertical" className="h-8" />
        <PriceDisplay amount={800} showFrom />
        <PriceDisplay amount={1250} to={4000} />
        <PriceDisplay amount={125000} compact size="lg" />
        <Sparkline values={[3, 5, 4, 7, 6, 9, 8, 12]} />
        <div className="w-full max-w-sm pt-2">
          <Progress value={64} label="প্রোফাইল সম্পূর্ণতা" />
        </div>
        <div className="w-full pt-4">
          <Stepper
            steps={["সেবা", "বিস্তারিত", "ঠিকানা", "সময়", "বাজেট", "পর্যালোচনা"]}
            current={2}
          />
        </div>
      </Row>

      <Row title="সেবার আইকন">
        {CATEGORIES.slice(0, 8).map((c) => (
          <CategoryIcon key={c._id} icon={c.icon} tint={c.tint} size="lg" />
        ))}
      </Row>

      <Row title="কার্ড">
        <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ServiceCard category={CATEGORIES[0]} />
          <ProviderCard provider={PROVIDERS[0]} />
          <Card variant="raised">
            <CardHeader>
              <CardTitle>সাধারণ কার্ড</CardTitle>
              <Badge tone="accent" size="sm">
                নতুন
              </Badge>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-fg-secondary">
                কার্ডের ভেতরের বিষয়বস্তু। মোট{" "}
                <span className="tabular">{formatCount(127, "কাজ")}</span>, শুরু{" "}
                <span className="tabular">{formatBdt(800)}</span>, রেটিং{" "}
                <span className="tabular">{formatRating(4.9)}</span>।
              </p>
            </CardBody>
          </Card>
        </div>
      </Row>

      <Row title="স্কেলিটন">
        <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ServiceCardSkeleton />
          <ProviderCardSkeleton />
          <BookingCardSkeleton />
        </div>
        <div className="w-full pt-4">
          <ReviewSkeleton />
        </div>
        <div className="flex w-full gap-3 pt-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton circle className="size-10" />
          <Skeleton className="h-10 w-24" />
        </div>
      </Row>

      <Row title="চার্ট">
        <div className="grid w-full gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <AreaChart data={ADMIN_METRICS.revenueByMonth} label="মাসিক আয়" />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <BarChart data={ADMIN_METRICS.bookingsByMonth} label="মাসিক বুকিং" />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 xl:col-span-2">
            <DonutChart
              data={ADMIN_METRICS.bookingsByCategory}
              label="সেবা অনুযায়ী কাজ"
            />
          </div>
        </div>
      </Row>

      <Row title="খালি অবস্থা ও ব্রেডক্রাম্ব">
        <div className="w-full">
          <Breadcrumb
            items={[
              { label: "হোম", href: "/" },
              { label: "সেবাসমূহ", href: "/services" },
              { label: "এসি সেবা", href: "/services/ac-repair" },
            ]}
          />
        </div>
        <div className="w-full rounded-lg border border-border bg-surface">
          <EmptyState
            title="এখনো কোনো বুকিং নেই"
            body="আপনার বুক করা সেবাগুলো এখানে দেখা যাবে।"
            icon={<Wrench />}
            cta="সেবা খুঁজুন"
            href="/services"
          />
        </div>
      </Row>
    </div>
  );
}
