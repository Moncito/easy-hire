import Bone from "@/components/employer/skeletons/Bone";

export default function ReportsSkeleton() {
  return (
    <>
      <Bone className="mb-3 h-4 w-32" />
      <Bone className="mb-6 h-8 w-48" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm lg:col-span-2">
          <Bone className="mb-4 h-5 w-40" />
          <Bone className="h-36 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
          <Bone className="mx-auto h-32 w-32 rounded-full" />
        </div>
      </div>
    </>
  );
}
