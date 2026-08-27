import Bone from "@/components/employer/skeletons/Bone";

export default function CompanyProfileSkeleton() {
  return (
    <div>
      <header className="flex items-start justify-between gap-4 border-b border-ink/10 pb-6">
        <div className="flex min-w-0 items-center gap-4">
          <Bone className="h-11 w-11 rounded-lg" />
          <div>
            <Bone className="h-3 w-28" />
            <Bone className="mt-2 h-8 w-56" />
            <Bone className="mt-2 h-4 w-32" />
          </div>
        </div>
        <Bone className="h-9 w-28 rounded-full" />
      </header>

      <section className="mt-6 flex flex-wrap gap-6 border-b border-ink/10 pb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-4 w-24" />
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5">
        <Bone className="h-3 w-16" />
        <Bone className="mt-3 h-4 w-full" />
        <Bone className="mt-2 h-4 w-4/5" />
        <Bone className="mt-2 h-4 w-2/3" />
      </section>

      <section className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5">
        <Bone className="h-3 w-20" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Bone className="h-6 w-20 rounded-full" />
          <Bone className="h-6 w-24 rounded-full" />
          <Bone className="h-6 w-16 rounded-full" />
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-4">
        <Bone className="h-8 w-24 rounded-full" />
        <Bone className="h-8 w-24 rounded-full" />
      </section>
    </div>
  );
}
