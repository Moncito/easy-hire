"use client";

import Bone from "@/components/employer/skeletons/Bone";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

const COLUMNS = ["Applied", "Shortlisted", "Interview", "Hired"];

export default function KanbanSkeleton() {
  const { isPro } = useEmployerShell();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 shrink-0 space-y-3">
        {isPro ? (
          <>
            <Bone className="h-9 w-64" />
            <Bone className="h-4 w-48" />
          </>
        ) : (
          <>
            <Bone className="h-7 w-48" />
            <Bone className="h-4 w-64" />
          </>
        )}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className={`h-8 w-24 ${isPro ? "rounded-full" : "rounded-xl"}`} />
          ))}
        </div>
      </div>
      <div className="kanban-scroll flex min-h-0 flex-1 gap-3 overflow-hidden">
        {COLUMNS.map((label) => (
          <div
            key={label}
            className={`flex h-full w-[min(100vw-3rem,20rem)] shrink-0 flex-col p-2 ${
              isPro ? "rounded-xl border border-ink/8 bg-ink/[0.03]" : "rounded-xl border border-ink/5 bg-white/60"
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className={isPro ? "pro-card p-3" : "rounded-xl border border-ink/5 bg-white p-3"}
                >
                  <div className="flex items-center gap-2">
                    <Bone className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Bone className="h-3.5 w-28" />
                      <Bone className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <Bone className="h-4 w-12 rounded-full" />
                    <Bone className="h-4 w-10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
