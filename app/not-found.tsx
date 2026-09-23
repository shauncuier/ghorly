import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";
import { ERRORS } from "@/lib/strings";
import { toBn } from "@/lib/format";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>

      <main
        id="main"
        className="container-page flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center"
      >
        <span className="text-6xl font-extrabold tabular text-ink-200">
          {toBn(404)}
        </span>
        <div className="flex max-w-md flex-col gap-3">
          <h1 className="text-3xl font-extrabold text-fg">{ERRORS.notFound.title}</h1>
          <p className="text-base text-fg-secondary">{ERRORS.notFound.body}</p>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">{ERRORS.notFound.cta}</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/services">সব সেবা দেখুন</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
