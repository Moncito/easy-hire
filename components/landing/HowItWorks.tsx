"use client";

import { useEffect, useRef } from "react";
import { UserCircle2, FileText, MousePointer2, Building2, PlusCircle, Users2, Sparkles } from "lucide-react";
import { gsap } from "@/lib/gsap";

const seekerSteps = [
  { title: "Build your profile", detail: "Add your specialized skills, work history, and portfolio in under 10 minutes.", icon: UserCircle2 },
  { title: "Browse verified jobs", detail: "Use advanced filters to search by role, pay, hours, and verified employer ratings.", icon: FileText },
  { title: "Apply in one click", detail: "Submit your pre-built profile and track all application statuses directly on your portal.", icon: MousePointer2 },
];

const employerSteps = [
  { title: "Register your company", detail: "Submit company details for manual verification by our trust and safety team.", icon: Building2 },
  { title: "Post a job listing", detail: "Set detailed roles, salary ranges, and test requirements to attract the perfect candidate.", icon: PlusCircle },
  { title: "Review applicants", detail: "Use our clean dashboard to shortlist, chat, schedule interviews, and hire VAs.", icon: Users2 },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Seeker refs
  const seekerTrackRef = useRef<HTMLDivElement>(null);
  const seekerCardsRef = useRef<HTMLDivElement[]>([]);
  
  // Employer refs
  const employerTrackRef = useRef<HTMLDivElement>(null);
  const employerCardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Scoped to containerRef: cleanup only reverts this section's own
    // tweens/ScrollTriggers instead of every ScrollTrigger on the page.
    const ctx = gsap.context(() => {
      const activeSeekerCards = seekerCardsRef.current.filter(Boolean);
      const activeEmployerCards = employerCardsRef.current.filter(Boolean);

      // 1. Header entrance
      gsap.fromTo(headerRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
          }
        }
      );

      // 2. Seeker timeline animations
      if (seekerTrackRef.current && activeSeekerCards.length > 0) {
        gsap.fromTo(seekerTrackRef.current,
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
            }
          }
        );
      }

      // Seeker card activations - use CSS transitions via classes instead of GSAP to fix bugs/lag
      activeSeekerCards.forEach((card, idx) => {
        gsap.fromTo(card,
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
            }
          }
        );
      });

      // 3. Employer timeline animations
      if (employerTrackRef.current && activeEmployerCards.length > 0) {
        gsap.fromTo(employerTrackRef.current,
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
            }
          }
        );
      }

      // Employer card activations - use CSS transitions via classes
      activeEmployerCards.forEach((card, idx) => {
        gsap.fromTo(card,
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
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative border-b border-ink/10 bg-gradient-to-b from-mist/50 to-mist px-8 py-24 overflow-hidden"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header Block */}
        <div ref={headerRef} className="mb-20 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-teal/15 bg-teal/5 px-3.5 py-1 text-xs font-semibold text-teal">
            <Sparkles className="h-3 w-3 fill-teal/20" strokeWidth={2} />
            Hassle-Free Platform Navigation
          </div>
          <h2 className="font-display text-7xl font-extrabold tracking-tight text-ink">
            How EasyHire works
          </h2>
          <p className="mt-4 text-base font-small text-ink/60 max-w-lg mx-auto">
            A simplified, streamlined experience engineered to take you from sign up to success in just three steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          {/* Seeker Column */}
          <div className="relative pl-12 md:pl-14">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-marigold/15">
                <UserCircle2 className="h-6 w-6 text-marigold" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-marigold tracking-tight">
                For job seekers
              </h3>
            </div>

            {/* Scroll filling line */}
            <div className="absolute left-[21px] md:left-[27px] top-[76px] bottom-12 w-[3px] bg-ink/5 rounded-full overflow-hidden">
              <div 
                ref={seekerTrackRef}
                className="w-full h-full bg-marigold origin-top scale-y-0 rounded-full" 
              />
            </div>

            {/* Steps list */}
            <div className="space-y-8">
              {seekerSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    ref={(el) => { if (el) seekerCardsRef.current[i] = el; }}
                    className="group relative rounded-2xl border border-marigold/10 bg-white/40 p-6 backdrop-blur-sm transition-all duration-300 [&.active-step]:border-marigold/25 [&.active-step]:bg-white/70 [&.active-step]:shadow-md hover:border-marigold/25 hover:bg-white/70 hover:shadow-md"
                  >
                    <div className="flex gap-5">
                      {/* Step Number Badge */}
                      <div className="step-number absolute -left-[45px] md:-left-[53px] top-[26px] z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-marigold/30 bg-[#F5F6F4] font-display text-sm font-bold text-marigold transition-all duration-300 group-[.active-step]:bg-marigold group-[.active-step]:text-mist group-[.active-step]:scale-110 group-[.active-step]:border-marigold group-hover:bg-marigold group-hover:text-mist group-hover:scale-110 group-hover:border-marigold">
                        {i + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Icon className="step-icon h-5 w-5 text-marigold/70 transition-all duration-300 group-[.active-step]:text-marigold group-[.active-step]:scale-110 group-[.active-step]:rotate-12 group-hover:text-marigold group-hover:scale-110 group-hover:rotate-12" strokeWidth={1.8} />
                          <p className="font-display text-lg font-bold text-ink tracking-tight">{step.title}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-ink/70">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employer Column */}
          <div className="relative pl-12 md:pl-14">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/15">
                <Building2 className="h-6 w-6 text-teal" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-teal tracking-tight">
                For employers
              </h3>
            </div>

            {/* Scroll filling line */}
            <div className="absolute left-[21px] md:left-[27px] top-[76px] bottom-12 w-[3px] bg-ink/5 rounded-full overflow-hidden">
              <div 
                ref={employerTrackRef}
                className="w-full h-full bg-teal origin-top scale-y-0 rounded-full" 
              />
            </div>

            {/* Steps list */}
            <div className="space-y-8">
              {employerSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    ref={(el) => { if (el) employerCardsRef.current[i] = el; }}
                    className="group relative rounded-2xl border border-teal/10 bg-white/40 p-6 backdrop-blur-sm transition-all duration-300 [&.active-step]:border-teal/25 [&.active-step]:bg-white/70 [&.active-step]:shadow-md hover:border-teal/25 hover:bg-white/70 hover:shadow-md"
                  >
                    <div className="flex gap-5">
                      {/* Step Number Badge */}
                      <div className="step-number absolute -left-[45px] md:-left-[53px] top-[26px] z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-[#F5F6F4] font-display text-sm font-bold text-teal transition-all duration-300 group-[.active-step]:bg-teal group-[.active-step]:text-mist group-[.active-step]:scale-110 group-[.active-step]:border-teal group-hover:bg-teal group-hover:text-mist group-hover:scale-110 group-hover:border-teal">
                        {i + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Icon className="step-icon h-5 w-5 text-teal/70 transition-all duration-300 group-[.active-step]:text-teal group-[.active-step]:scale-110 group-[.active-step]:rotate-12 group-hover:text-teal group-hover:scale-110 group-hover:rotate-12" strokeWidth={1.8} />
                          <p className="font-display text-lg font-bold text-ink tracking-tight">{step.title}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-ink/70">{step.detail}</p>
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