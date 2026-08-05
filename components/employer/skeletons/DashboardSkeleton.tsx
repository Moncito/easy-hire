import Bone from "@/components/employer/skeletons/Bone";

export default function DashboardSkeleton() {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Bone className="h-8 w-64" />
          <Bone className="h-4 w-80 max-w-full" />
        </div>
        <Bone className="h-11 w-40 rounded-xl" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Bone className="h-3 w-16" />
              <Bone className="h-8 w-8 rounded-lg" />
            </div>
            <Bone className="mt-4 h-8 w-12" />
            <Bone className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Bone className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
              <Bone className="h-5 w-3/4" />
              <Bone className="mt-2 h-3 w-1/2" />
              <div className="mt-4 flex justify-between border-t border-ink/5 pt-4">
                <Bone className="h-3 w-32" />
                <Bone className="h-8 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <Bone className="h-5 w-32" />
            <Bone className="mt-3 h-2 w-full rounded-full" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <Bone className="mb-4 h-5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="mb-3 h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
