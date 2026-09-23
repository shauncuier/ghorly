import { Section, SectionHeader } from "@/components/marketing/section";
import { TestimonialCard } from "@/components/domain/review-card";
import { TESTIMONIALS } from "@/lib/data/testimonials";

/**
 * Server component — no carousel.
 *
 * A masonry-ish column layout shows six testimonials at once on desktop and
 * scrolls naturally on mobile. A carousel would hide most of the social proof
 * behind an interaction and cost a client bundle for no gain.
 */
export function Testimonials() {
  return (
    <Section>
      <div className="container-page flex flex-col gap-10">
        <SectionHeader
          eyebrow="গ্রাহকদের কথা"
          title="যাঁরা ঘরলি ব্যবহার করেছেন"
          description="চট্টগ্রামের ঘর থেকে আসা সত্যিকারের অভিজ্ঞতা।"
          align="center"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.slice(0, 6).map((testimonial) => (
            <TestimonialCard key={testimonial._id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </Section>
  );
}
