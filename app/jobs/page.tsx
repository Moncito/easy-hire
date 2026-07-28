import JobSearchPanel from "@/components/jobs/JobSearchPanel";

export default function JobsPage() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(242,169,59,0.12),_transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <div className="mb-10 max-w-2xl animate-fade-in">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Find virtual assistant jobs
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/55 sm:text-base">
            Browse verified roles from employers hiring Filipino virtual assistants. Remote-friendly
            opportunities with transparent PHP salary ranges.
          </p>
        </div>
        <JobSearchPanel />
      </div>
    </div>
  );
}
