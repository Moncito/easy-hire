"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import ProPerkStripSkeleton from "@/components/employer/skeletons/ProPerkStripSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

type Props = {
  inline?: boolean;
};

function JobCardBones({ pro }: { pro: boolean }) {
  return (
    <div className={pro ? "pro-card p-5" : "rounded-2xl border border-ink/5 bg-white p-5 shadow-sm"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Bone className="h-5 w-3/4" />
          <Bone className="mt-2 h-3 w-1/2" />
        </div>
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-4 flex gap-4">
        <Bone className="h-8 w-12" />
        <Bone className="h-8 w-12" />
        <Bone className="h-8 w-12" />
      </div>
      <Bone className="mt-4 h-1.5 w-full rounded-full" />
      <div className="mt-4 flex gap-3">
        <Bone className="h-9 w-28 rounded-full" />
        <Bone className="h-4 w-16" />
        <Bone className="h-4 w-14" />
      </div>
    </div>
  );
}

function JobBoardBones({ pro }: { pro: boolean }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Bone className={`h-10 max-w-md flex-1 ${pro ? "rounded-full" : "rounded-xl"}`} />
        <Bone className={`h-10 w-40 ${pro ? "rounded-full" : "rounded-xl"}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardBones key={i} pro={pro} />
        ))}
      </div>
    </>
  );
}

export default function JobListSkeleton({ inline }: Props) {
  const { isPro } = useEmployerShell();

  if (inline) {
    return <JobBoardBones pro={isPro} />;
  }

  if (isPro) {
    return (
      <>
        <ProPageHeaderSkeleton />
        <ProPerkStripSkeleton />
        <JobBoardBones pro />
      </>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-2">
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-64" />
      </div>
      <JobBoardBones pro={false} />
    </div>
  );
}
