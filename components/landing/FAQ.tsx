"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { gsap } from "@/lib/gsap";

const faqs = [
  {
    question: "Is EasyHire free for job seekers?",
    answer:
      "Yes, EasyHire is 100% free for job seekers. You can build your premium profile, browse verified virtual assistant jobs, and apply to unlimited postings without ever entering a credit card.",
  },
  {
    question: "How are employers verified?",
    answer:
      "We take trust and safety seriously. Every employer undergoes manual security and business license checks by our administration team before they are authorized to post a job or view applicant details.",
  },
  {
    question: "What happens if an employer doesn't respond to my application?",
    answer:
      "We track response metrics for every company. If an employer fails to review applications within 7 business days, they receive automated warnings. Unresponsive employers are temporarily suspended to prevent applicant ghosting.",
  },
  {
    question: "How much does it cost employers to post a job?",
    answer:
      "Employers can get started with a free tier. We also offer featured job listings and flexible monthly subscriptions for agencies needing advanced tools, bulk candidate screening, and instant talent matching. Details are available on the pricing page.",
  },
];

export default function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const accordionRef = useRef<HTMLDivElement>(null);

  // Per-item refs for GSAP height/chevron animation
  const panelRefs = useRef<HTMLDivElement[]>([]);
  const chevronRefs = useRef<HTMLSpanElement[]>([]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Detect prefers-reduced-motion once on mount (not reactive — value won't change mid-session)
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      prefersReducedMotion.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }

    // gsap.context scoped to sectionRef — ctx.revert() only tears down this
    // section's entrance tweens/ScrollTriggers, not the whole page's.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });

      if (badgeRef.current) {
        tl.from(badgeRef.current, { y: 15, opacity: 0, duration: 0.55, ease: "power2.out" }, 0.1);
      }
      if (headingRef.current) {
        tl.from(headingRef.current, { y: 25, opacity: 0, duration: 0.65, ease: "power2.out" }, 0.2);
      }
      if (subtextRef.current) {
        tl.from(subtextRef.current, { y: 18, opacity: 0, duration: 0.55, ease: "power2.out" }, 0.32);
      }
      if (ctaCardRef.current) {
        tl.from(ctaCardRef.current, { y: 20, opacity: 0, duration: 0.55, ease: "power2.out" }, 0.42);
      }

      // Stagger accordion items in from right
      const items = accordionRef.current?.querySelectorAll<HTMLElement>(".faq-item") ?? [];
      if (items.length > 0) {
        tl.from(items, {
          x: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.09,
          ease: "power2.out",
        }, 0.28);
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animate answer panel height + chevron whenever openIndex changes
  useEffect(() => {
    panelRefs.current.forEach((panel, i) => {
      if (!panel) return;
      const chevronWrapper = chevronRefs.current[i];
      const isOpen = openIndex === i;

      if (prefersReducedMotion.current) {
        // Instant toggle — no animation, content always accessible
        panel.style.height = isOpen ? `${panel.scrollHeight}px` : "0px";
        return;
      }

      if (isOpen) {
        // Measure natural height, then animate to it
        const targetH = panel.scrollHeight;
        gsap.fromTo(
          panel,
          { height: 0 },
          { height: targetH, duration: 0.35, ease: "power2.inOut", overwrite: true }
        );
        if (chevronWrapper) {
          gsap.to(chevronWrapper, {
            rotation: 180,
            duration: 0.35,
            ease: "power2.inOut",
            overwrite: true,
          });
        }
      } else {
        gsap.to(panel, { height: 0, duration: 0.32, ease: "power2.inOut", overwrite: true });
        if (chevronWrapper) {
          gsap.to(chevronWrapper, {
            rotation: 0,
            duration: 0.32,
            ease: "power2.inOut",
            overwrite: true,
          });
        }
      }
    });
  }, [openIndex]);

  const handleToggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      id="FAQ"
      ref={sectionRef}
      className="relative overflow-hidden border-b border-ink/10 bg-gradient-to-b from-mist to-mist/50 px-6 py-24 md:px-8"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy/5 blur-3xl" />
      <div className="landing-grain pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="relative z-10 mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-12">
        {/* ── Left: sticky heading + CTA card ── */}
        <div className="mb-12 lg:sticky lg:top-28 lg:mb-0 lg:self-start">
          {/* Eyebrow badge */}
          <div
            ref={badgeRef}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy/5 px-3.5 py-1 text-xs font-semibold text-navy"
          >
            <Sparkles className="h-3 w-3 fill-navy/20" strokeWidth={2} />
            Support Center
          </div>

          <h2
            ref={headingRef}
            className="mb-4 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl"
          >
            Frequently asked
            <br className="hidden md:block" /> questions
          </h2>

          <p
            ref={subtextRef}
            className="mb-10 max-w-sm text-sm font-medium leading-relaxed text-ink/60 md:text-base"
          >
            Got questions? We have answers. If you can&apos;t find what you need here, reach out to our team.
          </p>

          {/* Still have questions CTA */}
          <div
            ref={ctaCardRef}
            className="relative overflow-hidden rounded-2xl border border-navy/20 bg-navy/5 p-7 backdrop-blur-md"
          >
            <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-navy/10 blur-xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-teal/10 blur-xl" />

            <div className="relative z-10">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-navy/15 text-navy">
                <HelpCircle className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="mb-1 font-display text-base font-bold tracking-tight text-ink">
                Still have questions?
              </p>
              <p className="mb-5 text-xs leading-relaxed text-ink/60 md:text-sm">
                We&apos;re here to help. Reach out to our dedicated support team and we will get back to you shortly.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-mist shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>

        {/* ── Right: accordion list ── */}
        <div ref={accordionRef} className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="faq-item overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:border-navy/20"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-150 hover:text-navy"
                >
                  <span className="font-display text-sm font-bold leading-snug tracking-tight text-ink md:text-base lg:text-lg">
                    {faq.question}
                  </span>
                  {/* Span wrapper so GSAP can rotate without touching the SVG directly */}
                  <span
                    ref={(el) => { if (el) chevronRefs.current[idx] = el; }}
                    className="shrink-0"
                    style={{ display: "inline-flex" }}
                    aria-hidden="true"
                  >
                    <ChevronDown
                      className="h-5 w-5 text-ink/50"
                      strokeWidth={2.5}
                    />
                  </span>
                </button>

                {/* Overflow-hidden container animated by GSAP — starts at height 0 */}
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                  ref={(el) => { if (el) panelRefs.current[idx] = el; }}
                  className="overflow-hidden"
                  style={{ height: 0 }}
                >
                  <div className="border-t border-ink/5 bg-white/50 px-6 py-5">
                    <p className="text-xs leading-relaxed text-ink/75 md:text-sm lg:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
