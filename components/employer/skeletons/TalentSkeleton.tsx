"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import ProPerkStripSkeleton from "@/components/employer/skeletons/ProPerkStripSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

export default function TalentSkeleton() {
  const { isPro } = useEmployerShell();

  if (isPro) {
    return (
      <div>
        <ProPageHeaderSkeleton actions={2} stats={1} />
        <ProPerkStripSkeleton />
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Bone className="h-11 max-w-xl flex-1 rounded-full" />
          <Bone className="h-11 w-24 rounded-full" />
          <Bone className="h-11 w-24 rounded-full" />
          <Bone className="h-11 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pro-card flex gap-4 p-5">
              <Bone className="h-14 w-14 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-4 w-44" />
                <Bone className="h-3 w-56" />
                <div className="flex gap-2">
                  <Bone className="h-5 w-16 rounded-full" />
                  <Bone className="h-5 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Bone className="mb-6 h-4 w-full max-w-xl" />
      <Bone className="mb-4 h-11 w-full max-w-xl rounded-full" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-10 w-24 rounded-xl" />
        ))}
      </div>
      <div className="divide-y divide-ink/5 rounded-2xl border border-ink/5 bg-white/40">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Bone className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-56" />
            </div>
            <Bone className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
