import Bone from "@/components/employer/skeletons/Bone";

export default function CollaboratorReportsSkeleton() {
  return (
    <div>
      <header className="border-b border-ink/10 pb-6">
        <Bone className="h-3 w-40" />
        <Bone className="mt-2 h-8 w-32" />
        <Bone className="mt-2 h-4 w-full max-w-md" />
      </header>

      <section className="mt-7 grid grid-cols-1 gap-4 border-y border-ink/10 py-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Bone className="h-3 w-24" />
            <Bone className="mt-2 h-8 w-16" />
            <Bone className="mt-1.5 h-3 w-32" />
          </div>
        ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 xl:col-span-2">
          <Bone className="h-3 w-16" />
          <Bone className="mt-2 h-5 w-40" />
          <Bone className="mt-4 h-[220px] w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
          <Bone className="h-3 w-16" />
          <Bone className="mt-2 h-5 w-32" />
          <Bone className="mt-4 h-[220px] w-full rounded-xl" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-5">
          <Bone className="h-3 w-20" />
          <Bone className="mt-4 h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-white/60 p-5">
          <Bone className="h-3 w-16" />
          <Bone className="h-8 w-full rounded-full" />
          <Bone className="h-8 w-full rounded-full" />
        </div>
      </div>

      <section className="mt-8">
        <Bone className="h-3 w-16" />
        <Bone className="mt-2 h-5 w-40" />
        <div className="mt-4 divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-white/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <Bone className="h-4 w-1/3" />
              <Bone className="h-3 w-1/4" />
              <Bone className="h-4 w-10" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
