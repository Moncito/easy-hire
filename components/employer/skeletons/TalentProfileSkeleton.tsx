"use client";

import Bone from "@/components/employer/skeletons/Bone";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

export default function TalentProfileSkeleton() {
  const { isPro } = useEmployerShell();
  const card = isPro ? "pro-card" : "employer-ws-surface rounded-2xl border";

  return (
    <div className="mx-auto max-w-[1480px] space-y-4">
      <Bone className="h-5 w-36" />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className={`${card} overflow-hidden p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Bone className="h-16 w-16 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-7 w-48" />
                <Bone className="h-4 w-56" />
                <div className="flex gap-2">
                  <Bone className="h-5 w-16 rounded-full" />
                  <Bone className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Bone className={`h-11 w-28 ${isPro ? "rounded-full" : "rounded-xl"}`} />
                <Bone className={`h-11 w-24 ${isPro ? "rounded-full" : "rounded-xl"}`} />
              </div>
            </div>
          </div>

          <div className={`${card} p-5`}>
            <Bone className="mb-3 h-4 w-20" />
            <Bone className="h-4 w-full" />
            <Bone className="mt-2 h-4 w-5/6" />
            <Bone className="mt-2 h-4 w-2/3" />
          </div>

          <div className={`${card} p-5`}>
            <Bone className="mb-4 h-4 w-28" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2 border-l-2 border-ink/10 pl-4">
                  <Bone className="h-4 w-48" />
                  <Bone className="h-3 w-36" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className={`${card} p-4`}>
            <Bone className="mb-3 h-4 w-24" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Bone className="h-2.5 w-16" />
                  <Bone className="h-3.5 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className={`${card} p-4`}>
            <Bone className="mb-2 h-3 w-16" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="h-5 w-16 rounded-md" />
              ))}
            </div>
          </div>
          <Bone className={`h-11 w-full ${isPro ? "rounded-full" : "rounded-2xl"}`} />
        </div>
      </div>
    </div>
  );
}
