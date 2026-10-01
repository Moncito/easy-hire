"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

type Props = {
  inline?: boolean;
};

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

/** Pro: filter pills + search/sort on one line, then one card of job rows. */
function ProApplicantsBoardBones({ rows }: { rows: number }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-8 w-24 rounded-full" />
        ))}
        <Bone className="h-9 w-72 rounded-control min-[1181px]:ml-auto" />
        <Bone className="h-9 w-40 rounded-control" />
      </div>
      <div className="mt-6 divide-y divide-eh-line overflow-hidden rounded-card border border-eh-line bg-eh-surface shadow-eh-sm">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center"
          >
            <div className="space-y-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-3 w-36" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Bone key={j} className="h-8 w-12" />
              ))}
            </div>
            <Bone className="h-2 w-full rounded-full" />
            <Bone className="h-9 w-36 rounded-control" />
          </div>
        ))}
      </div>
    </>
  );
}

function ApplicantsBoardBones({ pro, rows }: { pro: boolean; rows: number }) {
  if (pro) return <ProApplicantsBoardBones rows={rows} />;
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
      <div className="border-t border-ink/5">
        {Array.from({ length: rows }).map((_, i) => (
          <FreeApplicantRow key={i} />
        ))}
      </div>
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
