import Bone from "@/components/employer/skeletons/Bone";

export default function MessagesSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-ink/8 bg-white lg:w-[300px] lg:border-r">
        <div className="border-b border-ink/8 px-5 py-4">
          <Bone className="h-3 w-32" />
          <Bone className="mt-2 h-6 w-24" />
        </div>
        <div className="border-b border-ink/8 p-4">
          <Bone className="h-9 w-full rounded-full" />
        </div>
        <div className="flex-1 divide-y divide-ink/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Bone className="h-9 w-9 rounded-full" />
              <div className="min-w-0 flex-1">
                <Bone className="h-3.5 w-2/3" />
                <Bone className="mt-1.5 h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <section className="hidden min-h-0 flex-1 flex-col bg-mist/20 lg:flex">
        <div className="flex shrink-0 items-center gap-3 border-b border-ink/8 bg-white px-5 py-3">
          <Bone className="h-9 w-9 rounded-full" />
          <div>
            <Bone className="h-4 w-32" />
            <Bone className="mt-1.5 h-3 w-24" />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 px-5 py-4">
          <Bone className="h-10 w-1/2 rounded-2xl" />
          <Bone className="ml-auto h-10 w-2/5 rounded-2xl" />
          <Bone className="h-14 w-3/5 rounded-2xl" />
        </div>
      </section>
    </div>
  );
}
