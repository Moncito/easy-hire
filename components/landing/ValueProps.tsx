"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck, Send, MessageSquareWarning, Sparkles, BadgeCheck } from "lucide-react";
import { gsap } from "@/lib/gsap";

const verificationItems = [
  "Business license checked",
  "Identity confirmed",
  "Response commitment signed",
  "No fraud history",
];

export default function ValueProps() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const checkItemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // gsap.context scopes every tween/ScrollTrigger to sectionRef.
    // ctx.revert() tears down only this section's animations — never the
    // whole page's ScrollTriggers.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });

      if (badgeRef.current) {
        tl.from(badgeRef.current, {
          y: 15,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        }, 0.2);
      }

      if (headingRef.current) {
        tl.from(headingRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
        }, 0.35);
      }

      if (subtitleRef.current) {
        tl.from(subtitleRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        }, 0.45);
      }

      const activeCards = cardsRef.current.filter(Boolean);
      if (activeCards.length > 0) {
        tl.from(activeCards, {
          y: 50,
          opacity: 0,
          scale: 0.92,
          duration: 0.7,
          stagger: 0.12,
          ease: "back.out(1.3)",
        }, 0.55);
      }

      // Stagger verification checklist items after the hero card appears
      const activeCheckItems = checkItemsRef.current.filter(Boolean);
      if (activeCheckItems.length > 0) {
        tl.from(activeCheckItems, {
          x: -10,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: "power2.out",
        }, 0.9);
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;
    gsap.to(card, {
      y: -6,
      boxShadow: "0 28px 55px rgba(32, 36, 43, 0.11)",
      duration: 0.25,
      overwrite: "auto",
      ease: "power1.out",
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;
    gsap.to(card, {
      y: 0,
      boxShadow: "0 8px 30px rgba(32, 36, 43, 0.06)",
      duration: 0.3,
      overwrite: "auto",
      ease: "power1.out",
    });
  };

  return (
    <section
      id="ValueProps"
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-gradient-to-b from-mist via-mist/95 to-mist px-6 py-20 md:py-24 lg:py-32"
    >
      {/* Static gradient washes — compositor-only, no JS animation loop */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-navy/8 to-navy/2 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-teal/8 to-marigold/4 blur-3xl" />
      {/* Film-grain overlay at very low opacity for texture */}
      <div className="landing-grain pointer-events-none absolute inset-0 opacity-[0.04]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center md:mb-20">
          <div
            ref={badgeRef}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/8 px-4 py-2 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 fill-navy/40 text-navy" />
            <span className="text-xs font-semibold tracking-wide text-navy/90">
              Designed For Accountability
            </span>
          </div>

          <h2
            ref={headingRef}
            className="mb-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-6xl lg:text-7xl"
          >
            A safer, faster <br className="hidden md:block" />
            recruitment experience
          </h2>

          <p
            ref={subtitleRef}
            className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-ink/65 md:text-base lg:text-lg"
          >
            EasyHire eliminates the friction of traditional job boards, building trust
            and transparency on both sides of the hiring loop.
          </p>
        </div>

        {/* Bento grid
            Mobile:  1 col
            md:      2 cols — hero spans full width, stat spans full width
            lg:      3 cols — hero spans 2 cols, stat spans 2 cols        */}
        <div className="grid auto-rows-auto grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* ── Cell 1: ShieldCheck — hero wide cell with checklist ── */}
          <div
            ref={(el) => { if (el) cardsRef.current[0] = el; }}
            onMouseEnter={() => handleMouseEnter(0)}
            onMouseLeave={() => handleMouseLeave(0)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-ink/10 bg-white/55 p-8 backdrop-blur-md md:col-span-2 md:p-10 lg:col-span-2"
            style={{ boxShadow: "0 8px 30px rgba(32, 36, 43, 0.06)", willChange: "transform" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy/10 to-navy/3 opacity-50" />
            <div className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[10rem] font-extrabold leading-none text-ink/[0.055]">
              01
            </div>

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row">
              {/* Feature copy */}
              <div className="flex-1">
                <div className="feature-icon mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-br from-navy/15 to-navy/5">
                  <ShieldCheck className="h-7 w-7 stroke-[1.5] text-navy" />
                </div>
                <h3 className="mb-3 font-display text-xl font-bold leading-tight tracking-tight text-ink md:text-2xl">
                  Verified employers only
                </h3>
                <p className="max-w-sm text-sm font-medium leading-relaxed text-ink/70 md:text-base">
                  Every company is manually vetted and reviewed by our security team before their jobs go live. No spam, no scams.
                </p>
              </div>

              {/* Mock verification checklist — static, staggered in on scroll */}
              <div className="flex-shrink-0 lg:w-52 xl:w-60">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-navy/50">
                  Verification checklist
                </p>
                <div className="space-y-2">
                  {verificationItems.map((item, i) => (
                    <div
                      key={item}
                      ref={(el) => { if (el) checkItemsRef.current[i] = el; }}
                      className="flex items-center gap-2.5 rounded-xl border border-navy/10 bg-navy/5 px-3.5 py-2.5"
                    >
                      <BadgeCheck className="h-4 w-4 shrink-0 text-navy" strokeWidth={2} />
                      <span className="text-xs font-medium text-navy/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Cell 2: Send ── */}
          <div
            ref={(el) => { if (el) cardsRef.current[1] = el; }}
            onMouseEnter={() => handleMouseEnter(1)}
            onMouseLeave={() => handleMouseLeave(1)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-ink/10 bg-white/55 p-8 backdrop-blur-md"
            style={{ boxShadow: "0 8px 30px rgba(32, 36, 43, 0.06)", willChange: "transform" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-marigold/12 to-marigold/3 opacity-60" />
            <div className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[10rem] font-extrabold leading-none text-ink/[0.055]">
              02
            </div>

            <div className="relative z-10">
              <div className="feature-icon mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-br from-marigold/20 to-marigold/5">
                <Send className="h-7 w-7 stroke-[1.5] text-marigold" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold leading-tight tracking-tight text-ink md:text-2xl">
                One profile, apply anywhere
              </h3>
              <p className="text-sm font-medium leading-relaxed text-ink/70">
                Build your standardized, high-quality profile once. Apply to any verified VA role with a single click in seconds.
              </p>
            </div>
          </div>

          {/* ── Cell 3: MessageSquareWarning ── */}
          <div
            ref={(el) => { if (el) cardsRef.current[2] = el; }}
            onMouseEnter={() => handleMouseEnter(2)}
            onMouseLeave={() => handleMouseLeave(2)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-ink/10 bg-white/55 p-8 backdrop-blur-md"
            style={{ boxShadow: "0 8px 30px rgba(32, 36, 43, 0.06)", willChange: "transform" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal/12 to-teal/3 opacity-60" />
            <div className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[10rem] font-extrabold leading-none text-ink/[0.055]">
              03
            </div>

            <div className="relative z-10">
              <div className="feature-icon mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-br from-teal/20 to-teal/5">
                <MessageSquareWarning className="h-7 w-7 stroke-[1.5] text-teal" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold leading-tight tracking-tight text-ink md:text-2xl">
                We don&apos;t tolerate ghosting
              </h3>
              <p className="text-sm font-medium leading-relaxed text-ink/70">
                We enforce strict communication metrics. Employers are required to respond to every application, keeping you informed.
              </p>
            </div>
          </div>

          {/* ── Cell 4: Mini-stat — spans 2 cols on lg ── */}
          <div
            ref={(el) => { if (el) cardsRef.current[3] = el; }}
            onMouseEnter={() => handleMouseEnter(3)}
            onMouseLeave={() => handleMouseLeave(3)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-ink/10 bg-white/55 p-8 backdrop-blur-md lg:col-span-2"
            style={{ boxShadow: "0 8px 30px rgba(32, 36, 43, 0.06)", willChange: "transform" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy/8 to-navy/2 opacity-70" />
            <div className="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[10rem] font-extrabold leading-none text-ink/[0.04]">
              04
            </div>

            <div className="relative z-10 flex items-center gap-8">
              <div>
                <div className="mb-2 font-data text-5xl font-bold leading-none text-navy md:text-6xl">
                  7 days
                </div>
                <p className="max-w-xs text-xs leading-relaxed text-ink/55">
                  Maximum time before an unresponsive employer is flagged, warned, and suspended by our trust and safety team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
