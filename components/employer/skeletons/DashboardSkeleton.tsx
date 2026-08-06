import Bone from "@/components/employer/skeletons/Bone";

export default function DashboardSkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-2xl bg-navy/20 p-8">
            <Bone className="h-4 w-24 bg-white/20" />
            <Bone className="mt-3 h-8 w-64 bg-white/20" />
            <Bone className="mt-4 h-10 w-full max-w-md rounded-xl bg-white/15" />
          </div>
          <div className="flex gap-3">
            <Bone className="h-10 w-48 shrink-0 rounded-xl" />
            <Bone className="h-10 w-40 shrink-0 rounded-xl" />
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <Bone className="mx-auto h-28 w-28 rounded-full" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
              <Bone className="h-3 w-16" />
              <Bone className="mt-3 h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm lg:col-span-2">
          <Bone className="mb-4 h-5 w-40" />
          <Bone className="h-36 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <Bone className="mb-4 h-5 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="mb-3 h-6 w-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Bone className="mb-4 h-6 w-32" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
                <Bone className="h-5 w-3/4" />
                <Bone className="mt-2 h-3 w-1/2" />
                <Bone className="mt-4 h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
          <Bone className="mb-4 h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="mb-3 h-10 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
