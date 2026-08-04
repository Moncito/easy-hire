"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { LandingStats } from "@/lib/landing";

interface StatsBandProps {
  stats: LandingStats;
}

const STATS = [
  { key: "openJobs" as const, label: "Open verified roles", suffix: "+" },
  { key: "verifiedCompanies" as const, label: "Verified employers", suffix: "+" },
  { key: "seekers" as const, label: "VAs on the platform", suffix: "+" },
  { key: "static" as const, label: "Free for job seekers", suffix: "%" },
] as const;

export default function StatsBand({ stats }: StatsBandProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const values = [stats.openJobs, stats.verifiedCompanies, stats.seekers, 100];

    if (prefersReducedMotion) {
      numberRefs.current.forEach((el, i) => {
        if (el) el.textContent = values[i].toString();
      });
      return;
    }

    const ctx = gsap.context(() => {
      const counters = values.map((target) => ({ value: 0, target }));

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 75%",
        once: true,
        onEnter: () => {
          counters.forEach((counter, i) => {
            gsap.to(counter, {
              value: counter.target,
              duration: 2.0,
              ease: "power2.out",
              onUpdate: () => {
                const el = numberRefs.current[i];
                if (el) el.textContent = Math.floor(counter.value).toString();
              },
            });
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [stats]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-navy py-20 md:py-28"
    >
      {/* Grain overlay */}
      <div
        className="landing-grain pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
      />

      {/* Radial glows */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(31,128,115,0.5) 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(242,169,59,0.4) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {STATS.map((stat, i) => {
            const isLast = i === STATS.length - 1;
            return (
              <div
                key={stat.label}
                className={`flex flex-col items-center justify-center px-6 py-8 text-center ${
                  i > 0 ? "border-l border-white/10" : ""
                }`}
              >
                <p className="font-data text-4xl md:text-5xl font-bold text-mist tabular-nums">
                  <span
                    ref={(el) => {
                      numberRefs.current[i] = el;
                    }}
                  >
                    {isLast ? "100" : "0"}
                  </span>
                  <span>{stat.suffix}</span>
                </p>
                <p className="mt-2 text-xs font-medium tracking-wide text-mist/60 uppercase">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
