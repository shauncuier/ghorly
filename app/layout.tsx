import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

/**
 * Anek Bangla carries every visible string in the product.
 * Variable font, so no `weight` — we use 400–800 only (see globals.css).
 */
const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  display: "swap",
  variable: "--font-anek",
});

/** Inter is reserved for Latin fragments: the GHORLY wordmark, bKash/Visa, emails. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ghorly.com"),
  title: {
    default: "ঘরলি — আপনার ঘরের জন্য বিশ্বস্ত সেবা",
    template: "%s · ঘরলি",
  },
  description:
    "চট্টগ্রামের যাচাইকৃত স্থানীয় পেশাদারদের খুঁজে নিন — মেরামত, রক্ষণাবেক্ষণ, পরিষ্কার এবং আপনার ঘরের প্রয়োজনীয় সবকিছুর জন্য।",
  applicationName: "ঘরলি",
};

export const viewport: Viewport = {
  themeColor: "#0a7f63",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      dir="ltr"
      data-scroll-behavior="smooth"
      className={`${anekBangla.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-fg focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
        >
          মূল বিষয়বস্তুতে যান
        </a>
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
