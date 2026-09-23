import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { toBn } from "@/lib/format";
import { BRAND } from "@/lib/strings";

const POINTS = [
  "যাচাইকৃত স্থানীয় পেশাদার",
  "কাজের আগেই স্পষ্ট দাম",
  "নিরাপদ বুকিং ও পেমেন্ট",
];

/**
 * Split-screen auth shell: form on the left, a quiet brand panel on the right.
 *
 * The panel is flat ink with type and a few numbers rather than an
 * illustration — it holds up at every width and costs nothing to load.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col">
        <header className="flex items-center justify-between gap-4 px-6 py-6 md:px-10">
          <Logo />
          <Link
            href="/"
            className="rounded-xs text-sm text-fg-tertiary transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            হোমে ফিরে যান
          </Link>
        </header>

        <main id="main" className="flex flex-1 items-center justify-center px-6 py-10 md:px-10">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="px-6 py-6 md:px-10">
          <p className="text-xs text-fg-tertiary">
            © {toBn(2026)} ঘরলি। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </footer>
      </div>

      <aside className="relative hidden flex-col justify-between bg-ink-950 p-12 lg:flex">
        <Logo inverse href="/" />

        <div className="flex flex-col gap-8">
          <h2 className="max-w-md text-4xl font-extrabold text-white">
            {BRAND.tagline}
          </h2>
          <ul className="flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-base text-ink-300">
                <Check aria-hidden="true" strokeWidth={2.5} className="size-4 shrink-0 text-teal-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <dl className="flex gap-10 border-t border-white/10 pt-8">
          {[
            { value: `${toBn(500)}+`, label: "পেশাদার" },
            { value: `${toBn("2,000")}+`, label: "কাজ সম্পন্ন" },
            { value: `${toBn("4.8")}`, label: "গড় রেটিং" },
          ].map((m) => (
            <div key={m.label} className="flex flex-col gap-1">
              <dd className="text-2xl font-extrabold tabular text-white">{m.value}</dd>
              <dt className="text-sm text-ink-400">{m.label}</dt>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
