import JobSearchPanel from "@/components/jobs/JobSearchPanel";

export default function JobsPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Find virtual assistant jobs
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/55 sm:text-base">
          Browse verified roles from employers hiring Filipino virtual assistants. Remote-friendly
          opportunities with transparent PHP salary ranges.
        </p>
      </div>
      <JobSearchPanel />
    </div>
  );
}
