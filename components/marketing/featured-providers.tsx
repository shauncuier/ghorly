import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/marketing/section";
import { ProviderCard } from "@/components/domain/provider-card";
import { FEATURED_PROVIDERS } from "@/lib/data/providers";
import { ACTIONS } from "@/lib/strings";

export function FeaturedProviders() {
  return (
    <Section>
      <div className="container-page flex flex-col gap-10">
        <SectionHeader
          eyebrow="পেশাদারগণ"
          title="বিশ্বস্ত পেশাদারদের সাথে পরিচয়"
          description="প্রত্যেকের পরিচয় যাচাই করা, কাজের রেকর্ড খোলা, রেটিং গ্রাহকদের দেওয়া।"
          action={
            <Button asChild variant="secondary">
              <Link href="/services">
                {ACTIONS.viewAll}
                <ArrowLeft aria-hidden="true" className="rotate-180" />
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURED_PROVIDERS.map((provider) => (
            <ProviderCard key={provider._id} provider={provider} />
          ))}
        </div>
      </div>
    </Section>
  );
}
