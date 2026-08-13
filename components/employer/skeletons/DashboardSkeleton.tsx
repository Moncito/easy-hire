import type { ReactNode } from "react";
import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <EmployerSkeletonSurface className={className}>{children}</EmployerSkeletonSurface>;
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Compact hero */}
      <div className="employer-ws-hero-banner overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <Bone className="h-3 w-20 bg-white/20" />
            <Bone className="mt-2 h-7 w-56 max-w-full bg-white/20" />
            <div className="mt-3 flex gap-2">
              <Bone className="h-6 w-28 rounded-full bg-white/15" />
              <Bone className="h-6 w-32 rounded-full bg-white/15" />
            </div>
          </div>
          <div className="flex gap-2">
            <Bone className="h-10 w-28 rounded-xl bg-white/15" />
            <Bone className="h-10 w-32 rounded-xl bg-white/15" />
          </div>
        </div>
      </div>

      {/* Attention strip */}
      <div className="flex gap-3 overflow-hidden">
        <Bone className="h-10 w-44 shrink-0 rounded-xl" />
        <Bone className="h-10 w-36 shrink-0 rounded-xl" />
      </div>

      {/* Hiring playbook */}
      <div>
        <Bone className="h-3 w-24" />
        <Bone className="mt-2 h-6 w-52" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Surface key={i} className="!p-4">
              <Bone className="h-9 w-9 rounded-xl" />
              <Bone className="mt-3 h-4 w-24" />
              <Bone className="mt-2 h-3 w-full" />
            </Surface>
          ))}
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="min-w-0 space-y-4">
          {/* Active jobs */}
          <div>
            <Bone className="h-3 w-20" />
            <div className="mt-2 flex items-center justify-between">
              <Bone className="h-6 w-28" />
              <Bone className="h-3 w-14" />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Surface key={i} className="min-h-[248px]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Bone className="h-4 w-4/5" />
                      <Bone className="mt-2 h-3 w-3/5" />
                    </div>
                    <Bone className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Bone className="h-7 w-24 rounded-lg" />
                    <Bone className="h-7 w-20 rounded-lg" />
                  </div>
                  <Bone className="mt-4 h-1.5 w-full rounded-full" />
                  <Bone className="mt-2 h-1 w-full rounded-full" />
                  <Bone className="mt-4 h-10 w-full rounded-xl" />
                </Surface>
              ))}
            </div>
          </div>

          {/* Applicant queue */}
          <Surface>
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-6 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Bone className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <Bone className="h-4 w-36" />
                    <Bone className="mt-1.5 h-3 w-28" />
                  </div>
                  <Bone className="hidden h-5 w-16 rounded-md sm:block" />
                </div>
              ))}
            </div>
          </Surface>

          {/* Job performance */}
          <Surface>
            <Bone className="h-3 w-24" />
            <Bone className="mt-2 h-6 w-36" />
            <Bone className="mt-1.5 h-3 w-64" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Bone className="h-4 w-32" />
                  <Bone className="ml-auto h-4 w-8" />
                  <Bone className="h-4 w-8" />
                  <Bone className="h-4 w-10" />
                </div>
              ))}
            </div>
          </Surface>
        </div>

        {/* Command rail */}
        <div className="flex flex-col gap-3">
          <Surface className="overflow-hidden !p-0">
            <Bone className="h-10 w-full rounded-none" />
            <div className="grid grid-cols-2 gap-px bg-navy/[0.06] p-px">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="employer-ws-surface-muted px-4 py-3">
                  <Bone className="h-3 w-12" />
                  <Bone className="mt-2 h-7 w-10" />
                </div>
              ))}
            </div>
            <div className="border-t border-navy/[0.06] px-4 py-3">
              <Bone className="h-3 w-full" />
            </div>
          </Surface>

          <Surface>
            <Bone className="mb-3 h-5 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="mb-2 h-6 w-full last:mb-0" />
            ))}
          </Surface>

          <Surface>
            <Bone className="mb-3 h-5 w-28" />
            <Bone className="h-16 w-full rounded-xl" />
          </Surface>

          <Surface>
            <Bone className="mb-3 h-5 w-28" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="mb-3 flex gap-3 last:mb-0">
                <Bone className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Bone className="h-3 w-full" />
                  <Bone className="mt-1.5 h-3 w-16" />
                </div>
              </div>
            ))}
          </Surface>
        </div>
      </div>
    </div>
  );
}
