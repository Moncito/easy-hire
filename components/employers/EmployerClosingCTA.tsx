import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function EmployerClosingCTA() {
  return (
    <section className="relative w-full overflow-hidden bg-mist px-6 py-24 md:py-32">
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[450px] w-[450px] rounded-full bg-teal/15 blur-3xl animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-[450px] w-[450px] rounded-full bg-navy/10 blur-3xl animate-float-reverse"
        aria-hidden="true"
      />
      <div
        className="landing-grain pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="mb-6 font-display text-4xl font-extrabold leading-none tracking-tight text-ink md:text-6xl">
          Your next VA is a job post away.
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-ink/60 md:text-lg">
          Posting is free, every job gets reviewed before it goes live, and you keep
          100% of what you agree to pay your hire.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup?role=EMPLOYER"
            className="inline-flex items-center gap-2 rounded-full bg-teal px-8 py-4 text-base font-bold text-mist shadow-md transition-all hover:bg-teal/90 hover:-translate-y-0.5 active:scale-95"
          >
            Post a job — free
            <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-8 py-4 text-base font-bold text-ink shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
          >
            See pricing
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
