"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

const SECTIONS = [1, 2, 3, 4];

export default function JobFormSkeleton() {
  const { isPro } = useEmployerShell();

  return (
    <div className={isPro ? "pb-24" : ""}>
      {isPro ? (
        <ProPageHeaderSkeleton actions={0} stats={0} />
      ) : (
        <div className="mb-4 space-y-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-72" />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-ink/5 pb-4">
        <Bone className="h-8 w-40" />
        <Bone className="h-8 w-24 rounded-full" />
        <Bone className="h-8 w-20 rounded-full" />
        <Bone className="ml-auto h-2 w-32 rounded-full" />
      </div>

      <div className="space-y-5">
        {SECTIONS.map((i) => (
          <section key={i} className="border-b border-ink/5 pb-5">
            <Bone className="h-5 w-36" />
            <Bone className="mt-2 h-3 w-64" />
            {i === 1 ? (
              <>
                <Bone className="mt-4 h-8 w-3/4" />
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Bone className="h-10 w-full rounded-xl" />
                  <Bone className="h-10 w-full rounded-xl" />
                </div>
              </>
            ) : (
              <Bone className="mt-4 h-32 w-full rounded-xl" />
            )}
          </section>
        ))}
      </div>

      {isPro && (
        <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-4">
          <Bone className="h-8 w-64 rounded-full" />
          <div className="flex gap-2.5">
            <Bone className="h-11 w-24 rounded-full" />
            <Bone className="h-11 w-28 rounded-full" />
            <Bone className="h-11 w-40 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
