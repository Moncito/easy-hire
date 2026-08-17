"use client";

import { useEffect, useRef, useCallback } from "react";
import { ArrowRight, BadgeCheck, Star, TrendingUp, Clock } from "lucide-react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import { useLoginModalOptional } from "@/components/auth/LoginModalProvider";

// ─── Floating card data ───────────────────────────────────────────────────────
// depth: parallax depth factor (0.02–0.06), higher = moves more with pointer
const CARDS = [
  {
    id: "job-card",
    className: "top-[22%] left-[4%] w-52 animate-float-card",
    depth: 0.04,
    scrollSpeed: 0.06,
    content: (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-display text-[13px] font-bold text-ink">Executive VA</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-semibold text-teal">
            <BadgeCheck className="h-3 w-3" />
            Verified
          </span>
        </div>
        <p className="font-data text-[12px] text-ink/70">$800 / mo</p>
        <p className="text-[11px] text-ink/50">Remote · Full-time</p>
      </div>
    ),
  },
  {
    id: "status-chip",
    className: "top-[38%] left-[7%] w-40 animate-float-card-reverse",
    depth: 0.025,
    scrollSpeed: -0.04,
    content: (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-teal" />
        <span className="text-[12px] font-semibold text-ink">Shortlisted</span>
      </div>
    ),
  },
  {
    id: "salary-chip",
    className: "top-[18%] right-[5%] w-44 animate-float-card",
    depth: 0.05,
    scrollSpeed: 0.05,
    content: (
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-medium text-ink/50 uppercase tracking-wider">Avg. monthly</p>
        <p className="font-data text-lg font-bold text-marigold">$680</p>
        <div className="flex items-center gap-1 text-teal">
          <TrendingUp className="h-3 w-3" />
          <span className="text-[10px] font-semibold">+12% this quarter</span>
        </div>
      </div>
    ),
  },
  {
    id: "rating-chip",
    className: "top-[42%] right-[4%] w-36 animate-float-card-reverse",
    depth: 0.03,
    scrollSpeed: -0.03,
    content: (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="h-3 w-3 fill-marigold text-marigold" />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-ink">4.9 · 128 reviews</p>
      </div>
    ),
  },
  {
    id: "applied-chip",
    className: "bottom-[26%] left-[6%] w-48 animate-float-card",
    depth: 0.035,
    scrollSpeed: 0.045,
    content: (
      <div className="flex items-center gap-2.5">
        <Clock className="h-4 w-4 shrink-0 text-marigold" />
        <div>
          <p className="text-[11px] font-semibold text-ink">Applied 2h ago</p>
          <p className="text-[10px] text-ink/50">Admin Assistant · Makati</p>
        </div>
      </div>
    ),
  },
  {
    id: "match-chip",
    className: "bottom-[30%] right-[5%] w-40 animate-float-card-reverse",
    depth: 0.045,
    scrollSpeed: -0.05,
    content: (
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-medium text-ink/50">Profile match</p>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-ink/10">
            <div className="h-1.5 w-[88%] rounded-full bg-teal" />
          </div>
          <span className="font-data text-[12px] font-bold text-teal">88%</span>
        </div>
      </div>
    ),
  },
] as const;

// ─── Magnetic hover hook (primary CTA only) ──────────────────────────────────
function useMagneticButton() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const qx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power2.out" });
    const qy = gsap.quickTo(el, "y", { duration: 0.4, ease: "power2.out" });

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      qx((e.clientX - cx) * 0.25);
      qy((e.clientY - cy) * 0.25);
    };

    const onLeave = () => {
      qx(0);
      qy(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return ref;
}

// ─── Login prompt (preserved from original) ──────────────────────────────────
function LoginPrompt({ className }: { className: string }) {
  const loginModal = useLoginModalOptional();
  if (loginModal) {
    return (
      <p className={className}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => loginModal.openLogin()}
          className="cursor-pointer font-semibold underline-offset-2 hover:underline"
        >
          Log in
        </button>
      </p>
    );
  }
  return (
    <p className={className}>
      Already have an account?{" "}
      <Link href="/login" className="font-semibold underline-offset-2 hover:underline">
        Log in
      </Link>
    </p>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const wordWrapperRef = useRef<HTMLSpanElement>(null);
  const wordARef = useRef<HTMLSpanElement>(null); // "opportunity" (marigold)
  const wordBRef = useRef<HTMLSpanElement>(null); // "hire" (teal)
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const seekerRef = useMagneticButton();

  // Pointer parallax quickTo fns — created after mount
  const qxRefs = useRef<((v: number) => void)[]>([]);
  const qyRefs = useRef<((v: number) => void)[]>([]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;

    CARDS.forEach((card, i) => {
      qxRefs.current[i]?.(dx * card.depth);
      qyRefs.current[i]?.(dy * card.depth);
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    CARDS.forEach((_, i) => {
      qxRefs.current[i]?.(0);
      qyRefs.current[i]?.(0);
    });
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // Content is VISIBLE by default in the DOM. Entrance only enhances —
      // never gsap.set(opacity:0), so a failed/interrupted tween cannot blank the hero.
      const wordWraps = headlineRef.current?.querySelectorAll(".word-wrap") ?? [];
      const cards = cardRefs.current.filter(Boolean);

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (wordWraps.length) {
        tl.from(
          wordWraps,
          { y: 18, opacity: 0, duration: 0.65, stagger: 0.06, immediateRender: false },
          0.1
        );
      }
      tl.from(
        [subtextRef.current, ctaGroupRef.current, trustRef.current].filter(Boolean),
        { y: 18, opacity: 0, duration: 0.55, stagger: 0.08, immediateRender: false },
        0.35
      );
      if (cards.length) {
        tl.from(
          cards,
          { opacity: 0, scale: 0.92, duration: 0.55, stagger: 0.06, ease: "back.out(1.3)", immediateRender: false },
          0.45
        );
      }

      // Rotating accent word (y-slide)
      gsap.set(wordBRef.current, { yPercent: 105 });

      let showingA = true;
      const flipInterval = window.setInterval(() => {
        if (showingA) {
          gsap.to(wordARef.current, { yPercent: -105, duration: 0.42, ease: "power2.in" });
          gsap.to(wordBRef.current, { yPercent: 0, duration: 0.42, ease: "power2.out", delay: 0.08 });
        } else {
          gsap.to(wordBRef.current, { yPercent: -105, duration: 0.42, ease: "power2.in" });
          gsap.to(wordARef.current, { yPercent: 0, duration: 0.42, ease: "power2.out", delay: 0.08 });
        }
        showingA = !showingA;
      }, 2500);

      // Pointer parallax — quickTo on the INNER card
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        qxRefs.current[i] = gsap.quickTo(el, "x", { duration: 0.55, ease: "power2.out" });
        qyRefs.current[i] = gsap.quickTo(el, "y", { duration: 0.55, ease: "power2.out" });
      });

      // Scroll parallax — OUTER wrapper so it never fights pointer y
      const scrollCards = containerRef.current?.querySelectorAll<HTMLElement>("[data-scroll-card]") ?? [];
      scrollCards.forEach((el, i) => {
        const distance = (CARDS[i]?.scrollSpeed ?? 0.04) * 400;
        gsap.to(el, {
          y: distance,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      return () => clearInterval(flipInterval);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ── DESKTOP ─────────────────────────────────────────────────────────── */}
      <section
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative hidden min-h-screen w-full overflow-hidden bg-mist md:flex md:flex-col md:items-center md:justify-center"
        aria-label="Hero"
      >
        {/* Atmosphere: radial gradient washes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 65% 55% at 5% 10%, rgba(242,169,59,0.13) 0%, transparent 58%)",
              "radial-gradient(ellipse 55% 50% at 95% 15%, rgba(31,128,115,0.10) 0%, transparent 55%)",
              "radial-gradient(ellipse 45% 38% at 50% 105%, rgba(30,58,95,0.06) 0%, transparent 60%)",
            ].join(", "),
          }}
        />

        {/* Faint dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 seeker-area-dots opacity-60"
        />

        {/* Film grain overlay */}
        <div
          aria-hidden="true"
          className="landing-grain pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
        />

        {/* Floating cards (desktop) — outer = scroll parallax, inner = pointer parallax */}
        {CARDS.map((card, i) => (
          <div
            key={card.id}
            className={`absolute z-10 hidden md:block will-change-transform ${card.className}`}
            data-scroll-card={i}
          >
            <div
              ref={(el) => { cardRefs.current[i] = el; }}
              className="rounded-2xl border border-white/60 bg-white/80 p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md will-change-transform"
            >
              {card.content}
            </div>
          </div>
        ))}

        {/* Main content */}
        <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center px-6 pt-28 pb-16 text-center">
          {/* Headline */}
          <h1
            ref={headlineRef}
            className="mb-6 font-display text-[clamp(3rem,7vw,5.25rem)] font-extrabold leading-[1.07] tracking-tight text-ink"
          >
            {/* Line 1: word-by-word reveal */}
            {["Find", "your", "next"].map((word) => (
              <span key={word} className="word-wrap inline-block overflow-hidden align-bottom">
                <span className="inline-block">{word}&nbsp;</span>
              </span>
            ))}
            {/* Rotating accent word in overflow-hidden wrapper */}
            <span
              ref={wordWrapperRef}
              className="relative inline-block overflow-hidden align-bottom"
              style={{ minWidth: "10ch" }}
            >
              <span ref={wordARef} className="inline-block text-marigold">
                opportunity
              </span>
              <span
                ref={wordBRef}
                className="absolute left-0 top-0 inline-block text-teal"
              >
                hire
              </span>
            </span>
            {/* Line 2 */}
            <br />
            {["without", "the", "noise."].map((word) => (
              <span key={word} className="word-wrap inline-block overflow-hidden align-bottom">
                <span className="inline-block text-ink/55">{word}&nbsp;</span>
              </span>
            ))}
          </h1>

          {/* Subtext */}
          <p
            ref={subtextRef}
            className="mb-10 max-w-xl font-body text-[1.05rem] leading-relaxed text-ink/65"
          >
            Build one profile and apply to roles from employers we verify before
            they go live — or post a job and meet your next VA.
          </p>

          {/* CTAs */}
          <div ref={ctaGroupRef} className="flex flex-col items-center gap-4 sm:flex-row sm:gap-3">
            <Link
              ref={seekerRef}
              href="/signup?role=SEEKER"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-7 py-3.5 font-display text-[0.9375rem] font-bold text-mist shadow-lg shadow-black/10 transition-[box-shadow] duration-300 hover:shadow-xl hover:shadow-black/15 active:scale-95 will-change-transform"
            >
              I&apos;m looking for work
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/signup?role=EMPLOYER"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-teal/30 bg-teal/5 px-7 py-3.5 font-display text-[0.9375rem] font-bold text-teal transition-colors duration-200 hover:bg-teal/10 active:scale-95"
            >
              I&apos;m hiring
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Login prompt */}
          <LoginPrompt className="mt-5 text-sm text-ink/50" />

          {/* Trust strip */}
          <div
            ref={trustRef}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-ink/50"
          >
            {["500+ VAs ready to work", "Verified employers only", "Free for seekers"].map(
              (item, i, arr) => (
                <span key={item} className="flex items-center gap-2">
                  {item}
                  {i < arr.length - 1 && (
                    <span className="h-3.5 w-px bg-ink/15" aria-hidden="true" />
                  )}
                </span>
              )
            )}
          </div>
        </div>

        {/* Scroll cue */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-[10px] font-medium uppercase tracking-widest text-ink/30">
            Scroll
          </span>
          <span className="block h-6 w-px animate-[grow-line_1.6s_ease-in-out_infinite] bg-ink/20 origin-top" />
        </div>
      </section>

      {/* ── MOBILE ──────────────────────────────────────────────────────────── */}
      <section
        className="relative block min-h-screen w-full overflow-hidden bg-mist md:hidden"
        aria-label="Hero"
      >
        {/* Atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 80% 45% at 10% 5%, rgba(242,169,59,0.14) 0%, transparent 60%)",
              "radial-gradient(ellipse 70% 40% at 90% 20%, rgba(31,128,115,0.10) 0%, transparent 58%)",
            ].join(", "),
          }}
        />
        <div
          aria-hidden="true"
          className="landing-grain pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
        />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
          {/* Single floating card on mobile */}
          <div className="mb-8 w-fit rounded-2xl border border-white/60 bg-white/80 p-3 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-teal" />
              <span className="text-[12px] font-semibold text-ink">Verified employers only</span>
            </div>
          </div>

          <h1 className="mb-5 font-display text-5xl font-extrabold leading-tight tracking-tight text-ink">
            Find your next{" "}
            <span className="text-marigold">opportunity</span>
            <br />
            <span className="text-ink/50">without the noise.</span>
          </h1>

          <p className="mb-8 max-w-sm font-body text-base leading-relaxed text-ink/60">
            Build one profile and apply to roles from employers we verify before
            they go live — or post a job and meet your next VA.
          </p>

          <div className="flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/signup?role=SEEKER"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-display text-sm font-bold text-mist shadow-lg active:scale-95"
            >
              I&apos;m looking for work
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/signup?role=EMPLOYER"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-teal/30 bg-teal/5 py-3.5 font-display text-sm font-bold text-teal active:scale-95"
            >
              I&apos;m hiring
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <LoginPrompt className="mt-5 text-sm text-ink/50" />

          {/* Trust strip */}
          <div className="mt-10 flex flex-col items-center gap-1.5 text-xs font-medium text-ink/45">
            <span>500+ VAs ready to work</span>
            <span>Verified employers only · Free for seekers</span>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          aria-hidden="true"
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="block h-5 w-px animate-[grow-line_1.6s_ease-in-out_infinite] bg-ink/20 origin-top" />
        </div>
      </section>

      {/* Scroll-cue keyframe (CSS only, no JS) */}
      <style>{`
        @keyframes grow-line {
          0%   { transform: scaleY(0); opacity: 0; }
          40%  { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(1); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-float"] { animation: none !important; }
        }
      `}</style>
    </>
  );
}
