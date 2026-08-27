import Bone from "@/components/employer/skeletons/Bone";

const cardClass = "rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(32,36,43,0.04)]";

export default function CandidateReviewSkeleton() {
  return (
    <div>
      <Bone className="h-4 w-40" />

      <header className="mt-5 flex flex-col gap-4 border-b border-ink/7 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Bone className="h-11 w-11 rounded-lg" />
          <div>
            <Bone className="h-3 w-40" />
            <Bone className="mt-2 h-8 w-56" />
            <Bone className="mt-2 h-4 w-48" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Bone className="h-9 w-32 rounded-full" />
          <Bone className="h-9 w-24 rounded-full" />
        </div>
      </header>

      <div className="grid gap-6 py-7 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className={cardClass}>
            <Bone className="h-5 w-40" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Bone className="h-6 w-16 rounded-full" />
              <Bone className="h-6 w-20 rounded-full" />
              <Bone className="h-6 w-14 rounded-full" />
            </div>
            <Bone className="mt-5 h-16 w-full rounded-xl" />
          </section>

          <section className={cardClass}>
            <Bone className="h-5 w-44" />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <Bone className="h-5 w-24" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Bone className="h-6 w-6 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Bone className="h-3.5 w-3/4" />
                    <Bone className="mt-1.5 h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
            <Bone className="mt-5 h-16 w-full rounded-xl" />
          </section>
        </div>

        <div className="space-y-6">
          <section className={cardClass}>
            <Bone className="h-5 w-32" />
            <Bone className="mt-4 h-20 w-full rounded-xl" />
          </section>
          <section className={cardClass}>
            <Bone className="h-5 w-28" />
            <Bone className="mt-4 h-24 w-full rounded-xl" />
          </section>
          <section className={cardClass}>
            <Bone className="h-5 w-20" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Bone className="h-8 w-8 rounded-lg" />
                  <Bone className="h-3.5 flex-1" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
