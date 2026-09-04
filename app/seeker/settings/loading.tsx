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
      <div className="pt-6 sm:pt-8">
        <div className="mb-6 space-y-2 lg:mb-8">
          <Bone className="h-9 w-64 sm:w-72" />
          <Bone className="h-4 w-48" />
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/8">
          <Bone className="mb-4 h-5 w-40" />
          <div className="space-y-3">
            <Bone className="h-4 w-full max-w-md" />
            <Bone className="h-4 w-full max-w-sm" />
            <Bone className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
