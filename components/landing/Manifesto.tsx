"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const RULES = [
  {
    headline: ["No ghosting", "."],
    accentIdx: 1,
    accentColor: "text-marigold",
    support: "Employers answer every application, or they don't stay.",
    align: "left" as const,
  },
  {
    headline: ["No spam", "."],
    accentIdx: 1,
    accentColor: "text-teal",
    support: "Every employer is reviewed by a human before a single job goes live.",
    align: "right" as const,
  },
  {
    headline: ["No runaround", "."],
    accentIdx: 1,
    accentColor: "text-navy",
    support: "One profile, one click, real responses.",
    align: "left" as const,
  },
];

export default function Manifesto() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      lineRefs.current.forEach((el) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              el,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.75, ease: "power3.out" }
            );
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-mist px-6 py-28"
    >
      <div className="mx-auto max-w-5xl">
        {/* Eyebrow badge */}
        <div className="mb-16 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/8 px-4 py-2">
            <Sparkles className="h-3.5 w-3.5 fill-navy/40 text-navy" />
            <span className="text-xs font-semibold tracking-wide text-navy/90">
              Our house rules
            </span>
          </div>
        </div>

        {/* Lines */}
        <div className="flex flex-col gap-20 md:gap-24">
          {RULES.map((rule, i) => (
            <div
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className={`flex flex-col gap-3 ${
                rule.align === "right" ? "items-end text-right" : "items-start text-left"
              }`}
              style={{ opacity: 0 }}
            >
              <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-ink leading-none">
                {rule.headline.map((segment, si) => (
                  <span
                    key={si}
                    className={si === rule.accentIdx ? rule.accentColor : undefined}
                  >
                    {segment}
                  </span>
                ))}
              </h2>
              <p
                className={`max-w-md text-base text-ink/60 leading-relaxed`}
              >
                {rule.support}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
