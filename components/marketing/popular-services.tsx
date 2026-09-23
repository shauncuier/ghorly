import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { ServiceCard } from "@/components/domain/service-card";
import { POPULAR_CATEGORIES } from "@/lib/data/categories";
import { ACTIONS } from "@/lib/strings";

export function PopularServices() {
  return (
    <Section id="services">
      <div className="container-page flex flex-col gap-10">
        <SectionHeader
          eyebrow="সেবাসমূহ"
          title="ঘরের প্রয়োজনীয় সবকিছু"
          description="চট্টগ্রামজুড়ে ১৪টি ধরনের সেবা — যা লাগবে, দক্ষ হাতেই পাবেন।"
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
          {POPULAR_CATEGORIES.map((category) => (
            <ServiceCard key={category._id} category={category} />
          ))}
        </div>
      </div>
    </Section>
  );
}
