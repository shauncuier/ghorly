import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { formatPhone, toBn } from "@/lib/format";
import { BRAND } from "@/lib/strings";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "ঘরলি",
    links: [
      { label: "আমাদের সম্পর্কে", href: "/about" },
      { label: "ক্যারিয়ার", href: "/about#careers" },
      { label: "যোগাযোগ", href: "/contact" },
      { label: "সংবাদমাধ্যম", href: "/about#press" },
    ],
  },
  {
    heading: "সেবাসমূহ",
    links: [
      { label: "প্লাম্বিং", href: "/services/plumbing" },
      { label: "ইলেকট্রিক্যাল", href: "/services/electrical" },
      { label: "এসি সেবা", href: "/services/ac-repair" },
      { label: "পরিষ্কার", href: "/services/cleaning" },
      { label: "যন্ত্রপাতি মেরামত", href: "/services/appliance-repair" },
    ],
  },
  {
    heading: "পেশাদারগণ",
    links: [
      { label: "পেশাদার হিসেবে যোগ দিন", href: "/register/provider" },
      { label: "পেশাদার লগ ইন", href: "/login?role=provider" },
      { label: "পেশাদারদের সহায়িকা", href: "/for-professionals" },
    ],
  },
  {
    heading: "সহায়তা",
    links: [
      { label: "সহায়তা কেন্দ্র", href: "/contact#help" },
      { label: "নিরাপত্তা", href: "/about#safety" },
      { label: "শর্তাবলী", href: "/about#terms" },
      { label: "গোপনীয়তা", href: "/about#privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Logo />
            <p className="max-w-xs text-sm text-fg-secondary">{BRAND.supporting}</p>

            <ul className="mt-2 flex flex-col gap-2.5 text-sm text-fg-secondary">
              <li className="flex items-center gap-2.5">
                <MapPin aria-hidden="true" className="size-4 shrink-0 text-fg-tertiary" />
                {BRAND.city}, বাংলাদেশ
              </li>
              <li className="flex items-center gap-2.5">
                <Phone aria-hidden="true" className="size-4 shrink-0 text-fg-tertiary" />
                <span className="tabular">{formatPhone("01800000000")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail aria-hidden="true" className="size-4 shrink-0 text-fg-tertiary" />
                <span lang="en" className="font-latin">
                  hello@ghorly.com
                </span>
              </li>
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-fg">{column.heading}</h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="rounded-xs text-sm text-fg-secondary transition-colors hover:text-fg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-tertiary">
            © {toBn(2026)} ঘরলি। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-sm text-fg-tertiary">
            {BRAND.city}-এ ভালোবাসা নিয়ে তৈরি।
          </p>
        </div>
      </div>
    </footer>
  );
}
