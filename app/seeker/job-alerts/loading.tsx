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
          <Bone className="h-9 w-40" />
          <Bone className="h-4 w-72" />
        </div>
        <div className="space-y-0 divide-y divide-ink/8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Bone className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bone className="h-5 w-48" />
                <Bone className="h-3 w-32" />
              </div>
              <Bone className="h-8 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
