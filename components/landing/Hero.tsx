"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import { useLoginModalOptional } from "@/components/auth/LoginModalProvider";



export default function Hero() {
  const loginModal = useLoginModalOptional();
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSideRef = useRef<HTMLDivElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);

  const activeSide = useRef<"left" | "right" | "center">("center");

  const [statCount, setStatCount] = useState(0);
  const seam = useRef({ top: 55, bottom: 45 });

  const updateClipPaths = () => {
    if (leftSideRef.current) {
      leftSideRef.current.style.clipPath = `polygon(0 0, ${seam.current.top}% 0, ${seam.current.bottom}% 100%, 0 100%)`;
    }
    if (rightSideRef.current) {
      rightSideRef.current.style.clipPath = `polygon(${seam.current.top}% 0, 100% 0, 100% 100%, ${seam.current.bottom}% 100%)`;
    }
  };

  useEffect(() => {
    // gsap.context scopes every tween/ScrollTrigger created inside the
    // callback to containerRef. ctx.revert() on cleanup then only tears
    // down THIS component's animations — it never touches ScrollTriggers
    // belonging to other sections (Header, ValueProps, etc.), which is
    // what the previous `ScrollTrigger.getAll().forEach(kill)` pattern was
    // doing across the whole app.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        [leftContentRef.current, rightContentRef.current],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, delay: 0.2 }
      );

      // Count-up is a design flourish toward a round, honest marketing figure —
      // not framed as a live/real-time count (no pulsing "active now" indicator).
      const target = 500;
      const counterObj = { value: 0 };

      gsap.to(counterObj, {
        value: target,
        duration: 2.0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
        },
        onUpdate: () => {
          setStatCount(Math.floor(counterObj.value));
        },
      });

      updateClipPaths();
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;

    let side: "left" | "right" | "center" = "center";
    if (xPct < 47) {
      side = "left";
    } else if (xPct > 53) {
      side = "right";
    }

    if (activeSide.current !== side) {
      activeSide.current = side;

      let targetTop = 55;
      let targetBottom = 45;

      if (side === "left") {
        targetTop = 64;
        targetBottom = 54;
        gsap.to(rightContentRef.current, { opacity: 0.35, scale: 0.98, duration: 0.4, overwrite: "auto" });
        gsap.to(leftContentRef.current, { opacity: 1, scale: 1.02, duration: 0.4, overwrite: "auto" });
      } else if (side === "right") {
        targetTop = 46;
        targetBottom = 36;
        gsap.to(leftContentRef.current, { opacity: 0.35, scale: 0.98, duration: 0.4, overwrite: "auto" });
        gsap.to(rightContentRef.current, { opacity: 1, scale: 1.02, duration: 0.4, overwrite: "auto" });
      } else {
        targetTop = 55;
        targetBottom = 45;
        gsap.to([leftContentRef.current, rightContentRef.current], { opacity: 1, scale: 1, duration: 0.4, overwrite: "auto" });
      }

      gsap.to(seam.current, {
        top: targetTop,
        bottom: targetBottom,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto",
        onUpdate: updateClipPaths,
      });
    }
  };

  const handlePointerLeave = () => {
    activeSide.current = "center";
    gsap.to([leftContentRef.current, rightContentRef.current], { opacity: 1, scale: 1, duration: 0.5, overwrite: "auto" });
    gsap.to(seam.current, {
      top: 55,
      bottom: 45,
      duration: 0.6,
      ease: "power3.out",
      overwrite: "auto",
      onUpdate: updateClipPaths,
    });
  };

  function LoginPrompt({ className }: { className: string }) {
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

  return (
    <>
      {/* Desktop view */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="hidden md:relative md:block md:h-screen md:w-full md:overflow-hidden md:bg-mist"
      >
        <div
          ref={leftSideRef}
          className="absolute inset-0 bg-gradient-to-br from-marigold via-[#E09025] to-ember transition-all duration-300 ease-out"
          style={{ willChange: "clip-path" }}
        />
        <div
          ref={rightSideRef}
          className="absolute inset-0 bg-gradient-to-br from-[#2BA897] via-teal to-navy transition-all duration-300 ease-out"
          style={{ willChange: "clip-path" }}
        />

        <div className="absolute inset-0 z-[1] bg-black/[0.02] pointer-events-none" />

        {/* Seeker side */}
        <div className="absolute inset-y-0 left-16 z-[2] flex w-[38%] flex-col justify-center">
          <div ref={leftContentRef} className="origin-left transition-all duration-500">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-[#4A2E0A] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-marigold fill-marigold/30" />
              Your Next Career Step Awaits
            </div>

            <h1 className="mb-4 font-display text-3xl md:text-8xl font-extrabold leading-tight tracking-tight text-[#4A2E0A]">
              Find your next <br />
              <span className="relative text-2xl md:text-7xl text-white">
                opportunity
                <span className="absolute bottom-1 left-0 h-1.5 w-full bg-white/30 rounded-full" />
              </span>
            </h1>

            <p className="mb-8 text-lg font-medium text-[#4A2E0A]/85 leading-relaxed max-w-sm">
              Build your profile once and apply to jobs from employers we&apos;ve reviewed before they go live.
            </p>

          <Link href="/signup?role=SEEKER">
            <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-ink px-8 py-4 text-base font-bold text-mist shadow-lg shadow-black/10 transition-all hover:bg-ink/90 active:scale-95 cursor-pointer">
              I&apos;m looking for work
              <ArrowRight className="ml-2.5 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </Link>
          <LoginPrompt className="mt-4 text-sm font-medium text-[#4A2E0A]/85" />
          </div>
        </div>

        {/* Employer side */}
        <div className="absolute inset-y-0 right-16 z-[2] flex w-[38%] flex-col items-end justify-center text-right">
          <div ref={rightContentRef} className="origin-right transition-all duration-500 flex flex-col items-end">
            <h2 className="mb-4 font-display text-3xl md:text-8xl font-extrabold leading-tight tracking-tight text-[#E6F5EF]">
              Find your next <br />
              <span className="relative text-2xl md:text-7xl text-white">
                hire
                <span className="absolute bottom-1 right-0 h-1.5 w-full bg-white/30 rounded-full" />
              </span>
            </h2>

            <p className="mb-8 text-lg font-medium text-[#E6F5EF]/85 leading-relaxed max-w-sm">
              Post your job openings and review applicants directly, all in one place.
            </p>

            <Link href="/signup?role=EMPLOYER">

            <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-mist px-8 py-4 text-base font-bold text-teal shadow-lg shadow-black/10 transition-all hover:bg-mist/95 active:scale-95 cursor-pointer">
              I&apos;m hiring
              <ArrowRight className="ml-2.5 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </Link>
            <LoginPrompt className="mt-4 text-sm font-medium text-[#E6F5EF]/85" />
            <div className="mt-10 text-right">
              <p className="font-data text-2xl font-bold tracking-tight text-[#E6F5EF]">
                {statCount.toLocaleString()}+
              </p>
              <p className="text-xs text-[#E6F5EF]/80">VAs ready to work</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden bg-mist overflow-x-hidden">
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-marigold via-[#E09025] to-ember px-6 py-20 text-center overflow-hidden h-[55vh]">
          <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-[#D9553A]/30 blur-3xl animate-pulse" />
          <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-pulse" />

          <div className="relative z-10 max-w-md flex flex-col items-center">
            <h2 className="mb-2.5 font-display text-4xl md:text-8xl font-extrabold leading-tight tracking-tight text-[#4A2E0A]">
              Find your next <br />
              <span className="text-2xl md:text-7xl text-white">opportunity</span>
            </h2>

            <p className="mb-6 text-base font-medium text-[#4A2E0A]/85 leading-relaxed">
              Browse verified VA jobs, build your profile once, and apply with a single click.
            </p>

            <Link href="/signup?role=SEEKER" className="w-full max-w-xs">
              <span className="flex w-full items-center justify-center rounded-xl bg-ink py-3 text-sm font-bold text-mist shadow-lg transition-transform active:scale-95">
                I&apos;m looking for work
                <ArrowRight className="mb-0.5 ml-2.5 inline h-4 w-4" />
              </span>
            </Link>
            <LoginPrompt className="mt-4 text-sm font-medium text-[#4A2E0A]/85" />
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-[#2BA897] via-teal to-navy px-6 py-20 text-center overflow-hidden">
           <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-navy/40 blur-3xl animate-pulse" />
          <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-pulse" />

           <div className="relative z-10 max-w-md flex flex-col items-center">
             <h2 className="mb-2.5 font-display text-4xl md:text-8xl font-extrabold leading-tight tracking-tight text-[#E6F5EF]">
              Find your next <br />
              <span className="text-2xl md:text-7xl text-white">hire</span>
            </h2>

            <p className="mb-6 text-base font-medium text-[#E6F5EF]/85 leading-relaxed">
              Post jobs and review applicants directly, all in one place.
            </p>

            <Link href="/signup?role=EMPLOYER" className="w-full max-w-xs">
              <span className="flex w-full items-center justify-center rounded-xl bg-mist py-3 text-sm font-bold text-teal shadow-lg transition-transform active:scale-95">
                I&apos;m hiring
                <ArrowRight className="mb-0.5 ml-2.5 inline h-4 w-4" />
              </span>
            </Link>
            <LoginPrompt className="mt-4 text-sm font-medium text-[#E6F5EF]/85" />

            <div className="mt-8 text-center">
              <p className="font-data text-xl font-bold text-[#E6F5EF]">{statCount.toLocaleString()}+</p>
              <p className="text-xs text-[#E6F5EF]/80">VAs ready to work</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}