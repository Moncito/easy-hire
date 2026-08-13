import type { ReactNode } from "react";
import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <EmployerSkeletonSurface className={className}>{children}</EmployerSkeletonSurface>;
}

export default function ReportsSkeleton() {
  return (
    <>
      <Bone className="mb-2 h-4 w-32" />
      <Bone className="mb-1 h-8 w-48" />
      <Bone className="mb-4 h-4 w-72" />

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Surface key={i}>
            <Bone className="h-3 w-16" />
            <Bone className="mt-3 h-7 w-12" />
            <Bone className="mt-2 h-8 w-full" />
          </Surface>
        ))}
      </div>

      <Surface className="mb-4 !py-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Bone className="h-2.5 w-20" />
              <Bone className="mt-2 h-6 w-10" />
            </div>
          ))}
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Surface>
            <Bone className="mb-4 h-5 w-40" />
            <Bone className="h-36 w-full rounded-xl" />
          </Surface>
          <Surface>
            <Bone className="mb-4 h-5 w-32" />
            <Bone className="h-24 w-full" />
          </Surface>
        </div>
        <div className="space-y-3">
          <Surface className="!p-0">
            <Bone className="h-10 w-full rounded-none" />
            <div className="grid grid-cols-2 gap-px p-px">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-4">
                  <Bone className="h-2.5 w-12" />
                  <Bone className="mt-2 h-7 w-8" />
                </div>
              ))}
            </div>
          </Surface>
          <Surface>
            <Bone className="mb-3 h-4 w-24" />
            <Bone className="h-20 w-full" />
          </Surface>
        </div>
      </div>
    </>
  );
}
