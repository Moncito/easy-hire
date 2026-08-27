import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";

export default function WorkspaceOverviewSkeleton() {
  return (
    <div>
      <header className="flex items-end justify-between border-b border-ink/10 pb-6">
        <div className="flex min-w-0 items-center gap-4">
          <Bone className="h-11 w-11 rounded-lg" />
          <div>
            <Bone className="h-3 w-32" />
            <Bone className="mt-2 h-8 w-64" />
            <Bone className="mt-2 h-4 w-48" />
          </div>
        </div>
      </header>

      <Bone className="mt-5 h-16 w-full rounded-2xl" />

      <EmployerSkeletonSurface className="mt-7 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-7 w-12" />
          </div>
        ))}
      </EmployerSkeletonSurface>

      <section className="mt-9">
        <div className="flex items-center justify-between">
          <Bone className="h-5 w-40" />
          <Bone className="h-3 w-24" />
        </div>
        <div className="mt-4 divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <Bone className="h-10 w-10 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Bone className="h-4 w-1/3" />
                <Bone className="mt-1.5 h-3 w-1/5" />
              </div>
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-9 grid gap-8 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col}>
            <div className="flex items-center justify-between">
              <Bone className="h-5 w-32" />
              <Bone className="h-3 w-16" />
            </div>
            <div className="mt-4 divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-white/60 px-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Bone className="h-9 w-9 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Bone className="h-3.5 w-2/3" />
                    <Bone className="mt-1.5 h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
