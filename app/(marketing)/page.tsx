import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { TrustBar } from "@/components/marketing/trust-bar";
import { PopularServices } from "@/components/marketing/popular-services";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeaturedProviders } from "@/components/marketing/featured-providers";
import { RequestCta } from "@/components/marketing/request-cta";
import { ForProfessionals } from "@/components/marketing/for-professionals";
import { Testimonials } from "@/components/marketing/testimonials";
import { ChattogramMap } from "@/components/marketing/chattogram-map";
import { FinalCta } from "@/components/marketing/final-cta";

export const metadata: Metadata = {
  // `absolute` opts out of the root layout's "%s · ঘরলি" template, which
  // would otherwise render "ঘরলি — … · ঘরলি" on the home page.
  title: { absolute: "ঘরলি — আপনার ঘরের জন্য বিশ্বস্ত সেবা" },
  description:
    "চট্টগ্রামের যাচাইকৃত স্থানীয় পেশাদারদের খুঁজে নিন — প্লাম্বিং, ইলেকট্রিক্যাল, এসি, পরিষ্কার ও ঘরের প্রয়োজনীয় সব সেবা এক জায়গায়।",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: "ঘরলি",
    title: "ঘরলি — আপনার ঘরের জন্য বিশ্বস্ত সেবা",
    description:
      "চট্টগ্রামের যাচাইকৃত স্থানীয় পেশাদারদের খুঁজে নিন — ঘরের প্রতিটি কাজের জন্য।",
  },
  twitter: {
    card: "summary_large_image",
    title: "ঘরলি — আপনার ঘরের জন্য বিশ্বস্ত সেবা",
    description: "চট্টগ্রামের যাচাইকৃত স্থানীয় পেশাদার, এক জায়গায়।",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <PopularServices />
      <HowItWorks />
      <FeaturedProviders />
      <RequestCta />
      <ForProfessionals />
      <Testimonials />
      <ChattogramMap />
      <FinalCta />
    </>
  );
}
