"use client";

import { useEffect, useRef } from "react";
import {
  UserCircle2,
  FileText,
  MousePointer2,
  Building2,
  PlusCircle,
  Users2,
  Sparkles,
} from "lucide-react";
import { gsap } from "@/lib/gsap";

const seekerSteps = [
  {
    title: "Build your profile",
    detail: "Add your specialized skills, work history, and portfolio in under 10 minutes.",
    icon: UserCircle2,
  },
  {
    title: "Browse verified jobs",
    detail: "Use advanced filters to search by role, pay, hours, and verified employer ratings.",
    icon: FileText,
  },
  {
    title: "Apply in one click",
    detail: "Submit your pre-built profile and track all application statuses directly on your portal.",
    icon: MousePointer2,
  },
];

const employerSteps = [
  {
    title: "Register your company",
    detail: "Submit company details for manual verification by our trust and safety team.",
    icon: Building2,
  },
  {
    title: "Post a job listing",
    detail: "Set detailed roles, salary ranges, and test requirements to attract the perfect candidate.",
    icon: PlusCircle,
  },
  {
    title: "Review applicants",
    detail: "Use our clean dashboard to shortlist, chat, schedule interviews, and hire VAs.",
    icon: Users2,
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const seekerColRef = useRef<HTMLDivElement>(null);
  const seekerTrackRef = useRef<HTMLDivElement>(null);
  const seekerCardsRef = useRef<HTMLDivElement[]>([]);

  const employerColRef = useRef<HTMLDivElement>(null);
  const employerTrackRef = useRef<HTMLDivElement>(null);
  const employerCardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Scoped to containerRef: cleanup only reverts this section's own
    // tweens/ScrollTriggers instead of every ScrollTrigger on the page.
    const ctx = gsap.context(() => {
      const activeSeekerCards = seekerCardsRef.current.filter(Boolean);
      const activeEmployerCards = employerCardsRef.current.filter(Boolean);

      // 1. Header entrance
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
          },
        }
      );

      // 2. Seeker fill-line scrub
      if (seekerTrackRef.current && activeSeekerCards.length > 0) {
        gsap.fromTo(
          seekerTrackRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "top",
            ease: "none",
            scrollTrigger: {
              trigger: activeSeekerCards[0],
              endTrigger: activeSeekerCards[activeSeekerCards.length - 1],
              start: "center center",
              end: "center center",
              scrub: true,
            },
          }
        );
      }

      // Seeker card activations
      activeSeekerCards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0.4, scale: 0.98 },
          {
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              trigger: card,
              start: "top 75%",
              end: "bottom 60%",
              toggleActions: "play reverse play reverse",
              toggleClass: "active-step",
            },
          }
        );
      });

      // 3. Employer fill-line scrub
      if (employerTrackRef.current && activeEmployerCards.length > 0) {
        gsap.fromTo(
          employerTrackRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "top",
            ease: "none",
            scrollTrigger: {
              trigger: activeEmployerCards[0],
              endTrigger: activeEmployerCards[activeEmployerCards.length - 1],
              start: "center center",
              end: "center center",
              scrub: true,
            },
          }
        );
      }

      // Employer card activations
      activeEmployerCards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0.4, scale: 0.98 },
          {
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              trigger: card,
              start: "top 75%",
              end: "bottom 60%",
              toggleActions: "play reverse play reverse",
              toggleClass: "active-step",
            },
          }
        );
      });

      // 4. Desktop-only parallax depth on employer column
      //    Employer column scrolls slightly slower, creating a layered feel.
      gsap.matchMedia().add("(min-width: 1024px)", () => {
        if (employerColRef.current) {
          gsap.fromTo(
            employerColRef.current,
            { yPercent: 0 },
            {
              yPercent: -8,
              ease: "none",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="HowItWorks"
      ref={containerRef}
      className="relative overflow-hidden border-b border-ink/10 bg-gradient-to-b from-mist/50 to-mist px-8 py-24"
    >
      {/* Static gradient wash — no animated blobs */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-marigold/5 to-teal/5 blur-3xl" />

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div ref={headerRef} className="mb-20 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-teal/15 bg-teal/5 px-3.5 py-1 text-xs font-semibold text-teal">
            <Sparkles className="h-3 w-3 fill-teal/20" strokeWidth={2} />
            Hassle-Free Platform Navigation
          </div>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-ink md:text-7xl">
            How EasyHire works
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm font-medium text-ink/60 md:text-base">
            A simplified, streamlined experience engineered to take you from sign up to success in just three steps.
          </p>
        </div>

        {/* Steps grid — stacked on mobile, side-by-side on md+.
            Employer column gets a subtle parallax offset on lg+ via GSAP. */}
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          {/* ── Seeker Column ── */}
          <div ref={seekerColRef} className="relative pl-12 md:pl-14">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-marigold/15">
                <UserCircle2 className="h-6 w-6 text-marigold" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-xl font-extrabold tracking-tight text-marigold md:text-2xl">
                For job seekers
              </h3>
            </div>

            {/* Scroll filling line */}
            <div className="absolute bottom-12 left-[21px] top-[76px] w-[3px] overflow-hidden rounded-full bg-ink/5 md:left-[27px]">
              <div
                ref={seekerTrackRef}
                className="h-full w-full origin-top scale-y-0 rounded-full bg-marigold"
              />
            </div>

            <div className="space-y-8">
              {seekerSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    ref={(el) => { if (el) seekerCardsRef.current[i] = el; }}
                    className="group relative rounded-2xl border border-marigold/10 bg-white/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-marigold/25 hover:bg-white/70 hover:shadow-md [&.active-step]:border-marigold/25 [&.active-step]:bg-white/70 [&.active-step]:shadow-md"
                  >
                    <div className="flex gap-5">
                      {/* Step number badge */}
                      <div className="step-number absolute -left-[45px] top-[26px] z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-marigold/30 bg-[#F5F6F4] font-display text-sm font-bold text-marigold transition-all duration-300 group-hover:scale-110 group-hover:border-marigold group-hover:bg-marigold group-hover:text-mist group-[.active-step]:scale-110 group-[.active-step]:border-marigold group-[.active-step]:bg-marigold group-[.active-step]:text-mist md:-left-[53px]">
                        {i + 1}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2.5">
                          <Icon
                            className="step-icon h-5 w-5 text-marigold/70 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:text-marigold group-[.active-step]:rotate-12 group-[.active-step]:scale-110 group-[.active-step]:text-marigold"
                            strokeWidth={1.8}
                          />
                          <p className="font-display text-base font-bold tracking-tight text-ink md:text-lg">
                            {step.title}
                          </p>
                        </div>
                        <p className="text-xs leading-relaxed text-ink/70 md:text-sm">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Employer Column (parallax depth on lg+) ── */}
          <div ref={employerColRef} className="relative pl-12 md:pl-14">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/15">
                <Building2 className="h-6 w-6 text-teal" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-xl font-extrabold tracking-tight text-teal md:text-2xl">
                For employers
              </h3>
            </div>

            {/* Scroll filling line */}
            <div className="absolute bottom-12 left-[21px] top-[76px] w-[3px] overflow-hidden rounded-full bg-ink/5 md:left-[27px]">
              <div
                ref={employerTrackRef}
                className="h-full w-full origin-top scale-y-0 rounded-full bg-teal"
              />
            </div>

            <div className="space-y-8">
              {employerSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    ref={(el) => { if (el) employerCardsRef.current[i] = el; }}
                    className="group relative rounded-2xl border border-teal/10 bg-white/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-teal/25 hover:bg-white/70 hover:shadow-md [&.active-step]:border-teal/25 [&.active-step]:bg-white/70 [&.active-step]:shadow-md"
                  >
                    <div className="flex gap-5">
                      {/* Step number badge */}
                      <div className="step-number absolute -left-[45px] top-[26px] z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-[#F5F6F4] font-display text-sm font-bold text-teal transition-all duration-300 group-hover:scale-110 group-hover:border-teal group-hover:bg-teal group-hover:text-mist group-[.active-step]:scale-110 group-[.active-step]:border-teal group-[.active-step]:bg-teal group-[.active-step]:text-mist md:-left-[53px]">
                        {i + 1}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2.5">
                          <Icon
                            className="step-icon h-5 w-5 text-teal/70 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:text-teal group-[.active-step]:rotate-12 group-[.active-step]:scale-110 group-[.active-step]:text-teal"
                            strokeWidth={1.8}
                          />
                          <p className="font-display text-base font-bold tracking-tight text-ink md:text-lg">
                            {step.title}
                          </p>
                        </div>
                        <p className="text-xs leading-relaxed text-ink/70 md:text-sm">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
