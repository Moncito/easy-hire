"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck, Send, MessageSquareWarning, Sparkles } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const features = [
  {
    number: "01",
    icon: ShieldCheck,
    heading: "Verified employers only",
    description: "Every company is manually vetted and reviewed by our security team before their jobs go live. No spam, no scams.",
    color: "text-navy",
    accentGradient: "from-navy/20 to-navy/5",
    accentColor: "rgba(30, 58, 95, 0.25)",
  },
  {
    number: "02",
    icon: Send,
    heading: "One profile, apply anywhere",
    description: "Build your standardized, high-quality profile once. Apply to any verified VA role with a single click in seconds.",
    color: "text-marigold",
    accentGradient: "from-marigold/20 to-marigold/5",
    accentColor: "rgba(242, 169, 59, 0.25)",
  },
  {
    number: "03",
    icon: MessageSquareWarning,
    heading: "We don't tolerate ghosting",
    description: "We enforce strict communication metrics. Employers are required to respond to every application, keeping you informed.",
    color: "text-teal",
    accentGradient: "from-teal/20 to-teal/5",
    accentColor: "rgba(31, 128, 115, 0.25)",
  },
];

export default function ValueProps() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const blobsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // gsap.context scopes every tween/ScrollTrigger created inside this
    // callback to sectionRef. ctx.revert() during cleanup only tears down
    // this section's own animations instead of every ScrollTrigger on the
    // page (which is what a global `ScrollTrigger.getAll().kill()` would do).
    const ctx = gsap.context(() => {
      // Master timeline with ScrollTrigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });

      // 1. Animate background blobs first
      if (blobsRef.current[0]) {
        tl.from(blobsRef.current[0], {
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: "power3.out",
        }, 0);
      }
      if (blobsRef.current[1]) {
        tl.from(blobsRef.current[1], {
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: "power3.out",
        }, 0.1);
      }

      // 2. Animate badge
      if (badgeRef.current) {
        tl.from(badgeRef.current, {
          y: 15,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        }, 0.2);
      }

      // 3. Animate heading
      if (headingRef.current) {
        tl.from(headingRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
        }, 0.35);
      }

      // 4. Animate subtitle
      if (subtitleRef.current) {
        tl.from(subtitleRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        }, 0.45);
      }

      // 5. Animate cards with stagger
      const activeCards = cardsRef.current.filter(Boolean);
      if (activeCards.length > 0) {
        activeCards.forEach((card) => {
          gsap.set(card, { opacity: 1, y: 0, scale: 1 });
        });
        tl.from(activeCards, {
          y: 50,
          opacity: 0,
          scale: 0.92,
          duration: 0.7,
          stagger: 0.15,
          ease: "back.out(1.3)",
        }, 0.55);
      }

      // Floating blob loops — created paused, only play while the section
      // is actually in view so they don't burn CPU for the entire session.
      const blobTweens = blobsRef.current
        .filter((blob): blob is HTMLDivElement => Boolean(blob))
        .map((blob, idx) =>
          gsap.fromTo(
            blob,
            { x: idx === 0 ? -20 : 20, y: idx === 0 ? 10 : -10 },
            {
              x: idx === 0 ? 20 : -20,
              y: idx === 0 ? -10 : 10,
              duration: 16 + idx * 4,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              paused: true,
            }
          )
        );

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => blobTweens.forEach((t) => t.play()),
        onEnterBack: () => blobTweens.forEach((t) => t.play()),
        onLeave: () => blobTweens.forEach((t) => t.pause()),
        onLeaveBack: () => blobTweens.forEach((t) => t.pause()),
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Optimized hover handler - fires once on enter, not every frame
  const handleMouseEnter = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    // Simple, fast card lift and shadow
    gsap.to(card, {
      y: -8,
      boxShadow: "0 30px 60px rgba(32, 36, 43, 0.12)",
      duration: 0.25,
      overwrite: "auto",
      ease: "power1.out",
    });

    // Icon lift
    const icon = card.querySelector(".feature-icon");
    if (icon) {
      gsap.to(icon, {
        y: -4,
        scale: 1.08,
        duration: 0.25,
        overwrite: "auto",
        ease: "power1.out",
      });
    }
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    // Fast reset
    gsap.to(card, {
      y: 0,
      boxShadow: "0 16px 40px rgba(32, 36, 43, 0.08)",
      duration: 0.3,
      overwrite: "auto",
      ease: "power1.out",
    });

    // Reset icon
    const icon = card.querySelector(".feature-icon");
    if (icon) {
      gsap.to(icon, {
        y: 0,
        scale: 1,
        duration: 0.3,
        overwrite: "auto",
        ease: "power1.out",
      });
    }
  };

  return (
    <section
      id="ValueProps"
      ref={sectionRef}
      className="relative w-full bg-gradient-to-b from-mist via-mist/95 to-mist overflow-hidden px-6 py-20 md:py-24 lg:py-32"
    >
      {/* Premium Background Blobs - Optimized for performance */}
      <div
        ref={(el) => {
          if (el) blobsRef.current[0] = el;
        }}
        className="absolute -left-32 top-6 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-navy/10 to-navy/3 blur-2xl pointer-events-none opacity-50"
      />
      <div
        ref={(el) => {
          if (el) blobsRef.current[1] = el;
        }}
        className="absolute -right-32 bottom-20 h-[450px] w-[450px] rounded-full bg-gradient-to-tl from-teal/10 to-marigold/5 blur-2xl pointer-events-none opacity-40"
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Header Section - Premium Typography */}
        <div className="mb-16 md:mb-20 lg:mb-24 text-center">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/8 px-4 py-2 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 fill-navy/40 text-navy" />
            <span className="text-xs font-semibold tracking-wide text-navy/90">
              Designed For Accountability
            </span>
          </div>

          {/* Main Heading - Large & Premium */}
          <h2
            ref={headingRef}
            className="font-display text-4xl md:text-7xl lg:text-7xl font-extrabold tracking-tight text-ink leading-[1.15] mb-6"
          >
            A safer, faster <br className="hidden md:block" />
            recruitment experience
          </h2>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="mx-auto max-w-2xl text-sm md:text-base lg:text-lg text-ink/65 leading-relaxed font-medium"
          >
            EasyHire eliminates the friction of traditional job boards, building trust
            and transparency on both sides of the hiring loop.
          </p>
        </div>

        {/* Cards Grid - Premium Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.number}
                ref={(el) => {
                  if (el) cardsRef.current[idx] = el;
                }}
                onMouseEnter={() => handleMouseEnter(idx)}
                onMouseLeave={() => handleMouseLeave(idx)}
                className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/40 backdrop-blur-md p-8 md:p-10 lg:p-12 cursor-pointer transition-all duration-500 select-none"
                style={{
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  boxShadow: "0 16px 40px rgba(32, 36, 43, 0.08)",
                  opacity: 1,
                }}
              >
                {/* Card Spotlight Glow - Removed for performance */}
                
                {/* Background Gradient Accent */}
                <div
                  className={`absolute inset-0 opacity-40 pointer-events-none bg-gradient-to-br ${feature.accentGradient}`}
                />

                {/* Large Background Number */}
                <div className="absolute -right-8 -top-12 font-display text-8xl md:text-9xl font-extrabold text-ink/10 leading-none pointer-events-none select-none">
                  {feature.number}
                </div>

                {/* Card Content - Relative to content flow */}
                <div className="relative z-10">
                  {/* Icon - Larger & Better Styled */}
                  <div
                    className={`feature-icon inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accentGradient} border border-white/30 mb-6 transition-all duration-300`}
                  >
                    <Icon className={`h-8 w-8 ${feature.color} stroke-[1.5]`} />
                  </div>

                  {/* Heading */}
                  <h3 className="font-display text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-ink mb-4 leading-tight">
                    {feature.heading}
                  </h3>

                  {/* Description */}
                  <p className="text-sm md:text-sm lg:text-base leading-relaxed text-ink/70 font-medium">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}