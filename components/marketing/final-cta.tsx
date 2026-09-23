import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ACTIONS } from "@/lib/strings";

export function FinalCta() {
  return (
    <section className="border-t border-border bg-surface py-20 md:py-28">
      <div className="container-page flex flex-col items-center gap-7 text-center">
        <h2 className="max-w-3xl text-3xl font-extrabold text-fg md:text-5xl">
          আপনার ঘর বিশ্বস্ত হাতের যোগ্য।
        </h2>
        <p className="max-w-xl text-lg text-fg-secondary">
          ঝামেলা ছাড়াই নির্ভরযোগ্য স্থানীয় সেবা বুক করুন।
        </p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/services">{ACTIONS.findService}</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/register/provider">{ACTIONS.becomeProfessional}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
