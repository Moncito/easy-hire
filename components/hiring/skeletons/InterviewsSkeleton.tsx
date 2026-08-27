import Bone from "@/components/employer/skeletons/Bone";

export default function InterviewsSkeleton() {
  return (
    <div>
      <header className="border-b border-ink/10 pb-6">
        <Bone className="h-3 w-32" />
        <Bone className="mt-2 h-8 w-40" />
        <Bone className="mt-2 h-4 w-64" />
      </header>

      <div className="mt-8 space-y-8">
        {Array.from({ length: 2 }).map((_, group) => (
          <section key={group}>
            <div className="mb-3 flex items-center gap-3">
              <Bone className="h-3.5 w-16" />
              <div className="h-px flex-1 bg-ink/10" />
              <Bone className="h-3 w-20" />
            </div>
            <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/70">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:flex-nowrap">
                  <Bone className="h-10 w-10 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Bone className="h-4 w-40" />
                    <Bone className="mt-1.5 h-3 w-28" />
                  </div>
                  <Bone className="h-6 w-20 rounded-full" />
                  <Bone className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
