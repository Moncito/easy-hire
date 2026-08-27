import Bone from "@/components/employer/skeletons/Bone";

export default function HiringSetupSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <Bone className="h-4 w-16" />
      <header className="mt-4 border-b border-ink/10 pb-6 sm:mt-5 sm:pb-7">
        <Bone className="h-3 w-40" />
        <Bone className="mt-2 h-9 w-48" />
        <Bone className="mt-2 h-4 w-full max-w-xl" />
      </header>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(280px,.8fr)_minmax(0,1.2fr)] lg:gap-6">
        <section className="rounded-2xl border border-ink/10 bg-white/80 p-5 sm:p-6">
          <Bone className="h-5 w-32" />
          <Bone className="mt-3 h-3 w-full" />
          <div className="mt-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-ink/10 bg-white/80 p-5 sm:p-6">
          <Bone className="h-5 w-28" />
          <Bone className="mt-3 h-3 w-full" />
          <Bone className="mt-5 h-10 w-full rounded-xl" />
          <div className="mt-5 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <Bone className="mt-5 h-20 w-full rounded-xl" />
        </section>
      </div>
    </div>
  );
}
