"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { gsap } from "@/lib/gsap";

export default function EmployerHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(
        badgeRef.current,
        { y: 14, opacity: 0, duration: 0.5, immediateRender: false },
        0.05
      );

      const words = headlineRef.current?.querySelectorAll(".word-wrap") ?? [];
      if (words.length) {
        tl.from(
          words,
          { y: 20, opacity: 0, duration: 0.65, stagger: 0.05, immediateRender: false },
          0.15
        );
      }

      tl.from(
        [subtextRef.current, ctaGroupRef.current, trustRef.current].filter(Boolean),
        { y: 18, opacity: 0, duration: 0.55, stagger: 0.08, immediateRender: false },
        0.4
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="emp-bg relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      aria-label="Hire a verified Filipino VA"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--emp-hero-glow)" }}
      />

      <div
        aria-hidden="true"
        className="seeker-area-dots pointer-events-none absolute inset-0"
        style={{ opacity: "var(--emp-dot-opacity)" }}
      />

      <div
        aria-hidden="true"
        className="landing-grain pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{ opacity: "var(--emp-grain-opacity)" }}
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-28 pb-16 text-center">
        <div
          ref={badgeRef}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal/25 bg-teal/8 px-3.5 py-1.5 text-xs font-semibold text-teal"
        >
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
          For US, AU &amp; UK founders hiring in the Philippines
        </div>

        <h1
          ref={headlineRef}
          className="emp-text mb-6 font-display text-[clamp(2.75rem,6.5vw,4.75rem)] font-extrabold leading-[1.08] tracking-tight"
        >
          {["Hire", "a", "verified"].map((word) => (
            <span key={word} className="word-wrap inline-block overflow-hidden align-bottom">
              <span className="inline-block">{word}&nbsp;</span>
            </span>
          ))}
          <br className="hidden sm:block" />
          <span className="word-wrap inline-block overflow-hidden align-bottom">
            <span className="inline-block text-teal">Filipino&nbsp;</span>
          </span>
          <span className="word-wrap inline-block overflow-hidden align-bottom">
            <span className="inline-block text-teal">VA.</span>
          </span>
        </h1>

        <p
          ref={subtextRef}
          className="emp-text-secondary mb-10 max-w-xl font-body text-[1.05rem] leading-relaxed"
        >
          Post a role in minutes and meet skilled, English-fluent Virtual Assistants —
          every job we publish is admin-reviewed, and every applicant comes with a
          real, verifiable profile.
        </p>

        <div ref={ctaGroupRef} className="flex flex-col items-center gap-4 sm:flex-row sm:gap-3">
          <Link
            href="/signup?role=EMPLOYER"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-teal px-7 py-3.5 font-display text-[0.9375rem] font-bold text-mist shadow-lg shadow-teal/20 transition-[box-shadow] duration-300 hover:shadow-xl hover:shadow-teal/25 active:scale-95"
          >
            Post a job — free
            <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pricing"
            className="emp-secondary-btn group inline-flex items-center justify-center gap-2 rounded-2xl border px-7 py-3.5 font-display text-[0.9375rem] font-bold backdrop-blur-sm active:scale-95"
          >
            See pricing
            <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div
          ref={trustRef}
          className="emp-text-muted mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium"
        >
          {["Admin-reviewed job postings", "No salary markup or commission", "Free messaging at launch"].map(
            (item, i, arr) => (
              <span key={item} className="flex items-center gap-2">
                {item}
                {i < arr.length - 1 && (
                  <span className="emp-border h-3.5 w-px bg-current opacity-30" aria-hidden="true" />
                )}
              </span>
            )
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5"
      >
        <span className="emp-text-muted text-[10px] font-medium uppercase tracking-widest">
          Scroll
        </span>
        <span className="emp-text-muted block h-6 w-px origin-top animate-[grow-line_1.6s_ease-in-out_infinite] bg-current opacity-30" />
      </div>

      <style>{`
        @keyframes grow-line {
          0%   { transform: scaleY(0); opacity: 0; }
          40%  { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(1); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
