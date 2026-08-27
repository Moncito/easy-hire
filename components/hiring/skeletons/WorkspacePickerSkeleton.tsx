import Bone from "@/components/employer/skeletons/Bone";

export default function WorkspacePickerSkeleton() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-mist px-5 py-8 sm:px-8">
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-7 flex items-center justify-between">
          <Bone className="h-4 w-40" />
          <div className="flex items-center gap-3">
            <Bone className="h-8 w-8 rounded-full" />
            <Bone className="h-8 w-24" />
          </div>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <section>
            <Bone className="h-3 w-40" />
            <Bone className="mt-3 h-10 w-64" />
            <Bone className="mt-2 h-10 w-48" />
            <Bone className="mt-5 h-4 w-full max-w-md" />
            <Bone className="mt-2 h-4 w-3/4 max-w-md" />
            <Bone className="mt-7 h-16 w-full max-w-md rounded-lg" />
          </section>
          <section>
            <div className="overflow-hidden rounded-[24px] border border-ink/8 bg-white shadow-[0_16px_40px_rgba(32,36,43,0.06)]">
              <div className="flex items-center justify-between border-b border-ink/7 px-6 py-5">
                <div>
                  <Bone className="h-3 w-28" />
                  <Bone className="mt-2 h-7 w-32" />
                </div>
                <Bone className="h-7 w-7 rounded-full" />
              </div>
              <div className="divide-y divide-ink/7">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-5">
                    <Bone className="h-14 w-14 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <Bone className="h-5 w-40" />
                      <Bone className="mt-2 h-4 w-32" />
                      <Bone className="mt-3 h-5 w-24 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
