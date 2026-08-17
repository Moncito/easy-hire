"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import ProPerkStripSkeleton from "@/components/employer/skeletons/ProPerkStripSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

type Props = {
  inline?: boolean;
};

function ProApplicantRow() {
  return (
    <article className="pro-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Bone className="h-5 w-48" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
          <Bone className="h-3 w-56" />
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-4 w-16" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Bone className="h-5 w-8" />
          <Bone className="h-4 w-4 rounded" />
        </div>
      </div>
    </article>
  );
}

function FreeApplicantRow() {
  return (
    <div className="flex flex-col gap-2 border-b border-ink/5 px-2 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-4 w-56" />
        <Bone className="h-3 w-40" />
      </div>
      <Bone className="hidden h-4 w-16 sm:block" />
      <Bone className="hidden h-1.5 w-28 rounded-full md:block" />
      <Bone className="h-4 w-4 rounded" />
    </div>
  );
}

function ApplicantsBoardBones({ pro, rows }: { pro: boolean; rows: number }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Bone className={`h-10 w-full max-w-md ${pro ? "rounded-full" : "rounded-xl"}`} />
        <Bone className={`h-10 w-40 ${pro ? "rounded-full" : "rounded-xl"}`} />
      </div>
      {pro ? (
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <ProApplicantRow key={i} />
          ))}
        </div>
      ) : (
        <div className="border-t border-ink/5">
          {Array.from({ length: rows }).map((_, i) => (
            <FreeApplicantRow key={i} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ApplicantsHubSkeleton({ inline }: Props = {}) {
  const { isPro } = useEmployerShell();

  if (inline) {
    return <ApplicantsBoardBones pro={isPro} rows={6} />;
  }

  if (isPro) {
    return (
      <>
        <ProPageHeaderSkeleton />
        <ProPerkStripSkeleton />
        <ApplicantsBoardBones pro rows={5} />
      </>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-2">
        <Bone className="h-8 w-36" />
        <Bone className="h-4 w-64" />
      </div>
      <ApplicantsBoardBones pro={false} rows={8} />
    </div>
  );
}
