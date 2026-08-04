"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap } from "@/lib/gsap";

export default function ClosingCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Decorative ring scrub only — content is static and always visible.
      const rings = [ring1Ref.current, ring2Ref.current, ring3Ref.current];
      rings.forEach((ring, i) => {
        if (!ring) return;
        gsap.fromTo(
          ring,
          { scale: 1 },
          {
            scale: 1 + i * 0.06,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-mist px-6 py-28 md:py-36"
    >
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-marigold/20 blur-3xl animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-teal/20 blur-3xl animate-float-reverse"
        aria-hidden="true"
      />

      <div
        className="landing-grain pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
      />

      <div
        ref={ring1Ref}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/5"
        aria-hidden="true"
      />
      <div
        ref={ring2Ref}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/5"
        aria-hidden="true"
      />
      <div
        ref={ring3Ref}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[740px] w-[740px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/5"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <h2 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-ink mb-6 leading-none">
          Ready when you are.
        </h2>

        <p className="mx-auto max-w-xl text-base md:text-lg text-ink/60 mb-10">
          Join thousands of Virtual Assistants and verified employers already building
          better careers together.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup?role=SEEKER"
            className="inline-flex items-center gap-2 rounded-full bg-marigold px-8 py-4 text-base font-bold text-ink shadow-md transition-all hover:bg-marigold/90 hover:-translate-y-0.5 active:scale-95"
          >
            Find work
            <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href="/signup?role=EMPLOYER"
            className="inline-flex items-center gap-2 rounded-full bg-teal px-8 py-4 text-base font-bold text-mist shadow-md transition-all hover:bg-teal/90 hover:-translate-y-0.5 active:scale-95"
          >
            Hire a VA
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
