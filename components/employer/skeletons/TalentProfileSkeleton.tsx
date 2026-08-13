import type { ReactNode } from "react";
import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <EmployerSkeletonSurface className={className}>{children}</EmployerSkeletonSurface>;
}

export default function TalentProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[1480px] space-y-4">
      <Bone className="h-5 w-36" />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl bg-navy/90 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Bone className="h-16 w-16 shrink-0 rounded-2xl bg-white/10" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-3 w-24 bg-white/15" />
                <Bone className="h-7 w-48 bg-white/20" />
                <Bone className="h-4 w-56 bg-white/10" />
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Bone className="h-9 w-24 rounded-xl bg-white/10" />
                <Bone className="h-9 w-20 rounded-xl bg-white/10" />
              </div>
            </div>
          </div>

          <Surface>
            <Bone className="mb-3 h-3 w-16" />
            <Bone className="h-4 w-full" />
            <Bone className="mt-2 h-4 w-5/6" />
            <Bone className="mt-2 h-4 w-2/3" />
          </Surface>

          <Surface>
            <Bone className="mb-4 h-3 w-24" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2 border-l-2 border-ink/10 pl-4">
                  <Bone className="h-4 w-48" />
                  <Bone className="h-3 w-36" />
                  <Bone className="h-3 w-24" />
                </div>
              ))}
            </div>
          </Surface>

          <Surface>
            <Bone className="mb-4 h-3 w-20" />
            <div className="space-y-3">
              <Bone className="h-4 w-full" />
              <Bone className="h-3 w-3/4" />
            </div>
          </Surface>

          <Surface>
            <Bone className="mb-4 h-5 w-40" />
            <div className="flex items-center gap-3">
              <Bone className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-4 w-48" />
                <Bone className="h-3 w-28" />
              </div>
              <Bone className="h-5 w-16 rounded-md" />
            </div>
          </Surface>
        </div>

        <div className="flex flex-col gap-3">
          <Surface className="!p-0">
            <Bone className="h-10 w-full rounded-none" />
            <div className="grid grid-cols-2 gap-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Bone className="h-2.5 w-16" />
                  <Bone className="h-3.5 w-full" />
                </div>
              ))}
            </div>
          </Surface>
          <Surface>
            <div className="flex items-center gap-3">
              <Bone className="h-10 w-10 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Bone className="h-3.5 w-28" />
                <Bone className="h-2.5 w-36" />
              </div>
            </div>
          </Surface>
          <Surface>
            <Bone className="mb-2 h-3 w-16" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-5 w-16 rounded-md" />
              ))}
            </div>
          </Surface>
          <Bone className="h-10 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
