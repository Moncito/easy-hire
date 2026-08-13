import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";

function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <EmployerSkeletonSurface className={className}>{children}</EmployerSkeletonSurface>;
}

export default function BillingLoading() {
  return (
    <>
      <Bone className="mb-1 h-8 w-32" />
      <Bone className="mb-6 h-4 w-80" />

      <Surface className="mb-4 !py-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Bone className="h-2.5 w-24" />
              <Bone className="mt-2 h-6 w-20" />
              <Bone className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      </Surface>

      <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-white/90 shadow-[0_8px_24px_-6px_rgba(30,58,95,0.08)]">
        <div className="border-b border-navy/[0.06] px-6 py-4">
          <Bone className="h-5 w-48" />
        </div>
        <div className="space-y-0 p-0">
          <div className="grid grid-cols-3 gap-4 border-b border-navy/[0.06] px-6 py-3">
            <Bone className="h-3 w-16" />
            <Bone className="mx-auto h-3 w-20" />
            <Bone className="mx-auto h-3 w-20" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-3 gap-4 border-b border-navy/[0.05] px-6 py-3 last:border-b-0"
            >
              <Bone className="h-4 w-full max-w-[200px]" />
              <Bone className="mx-auto h-4 w-4 rounded-full" />
              <Bone className="mx-auto h-4 w-4 rounded-full" />
            </div>
          ))}
        </div>
        <div className="border-t border-navy/[0.06] px-6 py-4">
          <Bone className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}
