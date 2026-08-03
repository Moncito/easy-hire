import { SeekerNavBandSkeleton } from "@/components/seeker/SeekerPageSkeletons";

function Bone({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-ink/8 ${className ?? ""}`} aria-hidden="true" />
  );
}

export default function Loading() {
  return (
    <div className="pb-16">
      <SeekerNavBandSkeleton />
      <div className="space-y-6 pt-6 sm:pt-8">
        <div className="space-y-2">
          <Bone className="h-9 w-48" />
          <Bone className="h-4 w-64" />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Bone className="h-10 flex-1 rounded-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-8 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-ink/8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Bone className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Bone className="h-5 w-48" />
                <Bone className="h-3 w-32" />
                <Bone className="h-4 w-full max-w-sm" />
              </div>
              <Bone className="h-9 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
