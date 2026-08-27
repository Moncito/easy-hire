import Bone from "@/components/employer/skeletons/Bone";

export default function JobCandidateQueueSkeleton() {
  return (
    <div>
      <Bone className="h-3.5 w-32" />

      <header className="mt-4 border-b border-ink/[0.07] pb-6">
        <div className="flex items-center justify-between gap-3">
          <Bone className="h-3 w-32" />
          <div className="flex items-center gap-4">
            <Bone className="h-3.5 w-16" />
            <Bone className="h-3.5 w-20" />
          </div>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Bone className="h-8 w-56" />
            <Bone className="mt-2 h-4 w-40" />
          </div>
          <div className="flex items-center gap-5">
            <div>
              <Bone className="h-6 w-8" />
              <Bone className="mt-1.5 h-3 w-24" />
            </div>
            <div className="h-8 border-l border-ink/10" />
            <div>
              <Bone className="h-6 w-8" />
              <Bone className="mt-1.5 h-3 w-20" />
            </div>
          </div>
        </div>
      </header>

      <section className="mt-7">
        <div className="flex items-center justify-between border-b border-ink/[0.07] pb-3">
          <Bone className="h-5 w-32" />
          <Bone className="h-3 w-28" />
        </div>
        <div className="mt-4 divide-y divide-ink/[0.07] overflow-hidden rounded-2xl border border-ink/[0.07] bg-white/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-4 sm:px-4">
              <Bone className="h-10 w-10 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Bone className="h-4 w-40" />
                <Bone className="mt-1.5 h-3 w-28" />
                <div className="mt-2 flex gap-1.5">
                  <Bone className="h-4 w-14" />
                  <Bone className="h-4 w-14" />
                </div>
              </div>
              <Bone className="hidden h-5 w-16 rounded-full sm:block" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
