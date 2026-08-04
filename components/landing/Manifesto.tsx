"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { gsap } from "@/lib/gsap";

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

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".manifesto-item");

      cards.forEach((card) => {
        const heading = card.querySelector(".manifesto-heading");
        const paragraph = card.querySelector(".manifesto-support");
        const dot = card.querySelector(".manifesto-dot");

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        });

        tl.fromTo(
          heading,
          {
            y: 36,
            opacity: 0,
            scale: 0.96,
            filter: "blur(10px)",
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
          }
        )
          .fromTo(
            dot,
            {
              scale: 0,
              rotate: -90,
            },
            {
              scale: 1.25,
              rotate: 0,
              duration: 0.35,
              ease: "back.out(3)",
            },
            "-=0.25"
          )
          .to(
            dot,
            {
              scale: 1,
              duration: 0.2,
            },
            ">"
          )
          .fromTo(
            paragraph,
            {
              y: 18,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              ease: "power2.out",
            },
            "-=0.1"
          );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-mist px-6 py-32 lg:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-24 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-5 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-navy" />
            <span className="text-sm font-semibold text-navy">
              Our house rules
            </span>
          </div>
        </div>

        <div className="space-y-32 lg:space-y-40">
          {RULES.map((rule, i) => (
            <div
              key={i}
              className={`manifesto-item flex flex-col gap-6 ${
                rule.align === "right"
                  ? "items-end text-right"
                  : "items-start text-left"
              }`}
            >
              <h2
                className="
                  manifesto-heading
                  font-display
                  font-black
                  tracking-[-0.05em]
                  leading-[0.9]
                  text-ink
                  text-[clamp(4rem,8vw,8rem)]
                "
              >
                {rule.headline.map((segment, si) => (
                  <span
                    key={si}
                    className={
                      si === rule.accentIdx
                        ? `manifesto-dot inline-block ${rule.accentColor}`
                        : ""
                    }
                  >
                    {segment}
                  </span>
                ))}
              </h2>

              <p
                className="
                  manifesto-support
                  max-w-lg
                  text-lg
                  leading-relaxed
                  text-ink/60
                "
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