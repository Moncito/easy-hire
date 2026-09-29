"use client";

import type { ReactNode } from "react";
import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <EmployerSkeletonSurface className={className}>{children}</EmployerSkeletonSurface>;
}

/** Mirrors ProDashboardBoard: header, attention list, KPI row, roles beside pipeline and recent applicants. */
function ProDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Bone className="h-8 w-40 sm:h-9" />
          <Bone className="mt-2 h-4 w-52" />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Bone className="h-11 w-40 rounded-full" />
          <Bone className="h-11 w-32 rounded-full" />
        </div>
      </header>

      <section className="pro-card overflow-hidden !p-0">
        <Bone className="mx-5 mb-3 mt-4 h-5 w-44 sm:mx-6" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-ink/[0.06] px-5 py-3.5 sm:px-6">
            <Bone className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-4 w-56 max-w-full" />
              <Bone className="h-3 w-36" />
            </div>
            <Bone className="h-4 w-16" />
          </div>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="pro-card px-4 py-3.5 sm:px-5">
            <Bone className="h-3.5 w-24" />
            <Bone className="mt-2 h-7 w-12" />
            <Bone className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <Bone className="h-5 w-28" />
              <Bone className="mt-2 h-4 w-32" />
            </div>
            <Bone className="h-4 w-16" />
          </div>
          <div className="pro-card overflow-hidden !p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-ink/[0.06] px-5 py-4 last:border-0">
                <div className="flex-1 space-y-1.5">
                  <Bone className="h-4 w-40" />
                  <Bone className="h-3 w-28" />
                </div>
                <Bone className="h-4 w-8" />
                <Bone className="h-4 w-8" />
                <Bone className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>
        <div className="flex flex-col gap-6">
          <section>
            <Bone className="mb-2 h-5 w-24" />
            <Bone className="mb-4 h-4 w-28" />
            <div className="pro-card space-y-4 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <Bone className="h-3.5 w-28" />
                    <Bone className="h-3.5 w-6" />
                  </div>
                  <Bone className="mt-2 h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </section>
          <section>
            <Bone className="mb-2 h-5 w-36" />
            <Bone className="mb-4 h-4 w-40" />
            <div className="pro-card overflow-hidden !p-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-ink/[0.06] px-4 py-3.5 last:border-0">
                  <Bone className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Bone className="h-3.5 w-32" />
                    <Bone className="h-3 w-24" />
                  </div>
                  <Bone className="h-5 w-16 rounded-md" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FreeDashboardSkeleton() {
  return (
    <div className="space-y-4">
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

      <div className="flex gap-3 overflow-hidden">
        <Bone className="h-10 w-44 shrink-0 rounded-xl" />
        <Bone className="h-10 w-36 shrink-0 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Surface key={i} className="min-h-[248px]">
                <Bone className="h-4 w-4/5" />
                <Bone className="mt-2 h-3 w-3/5" />
                <Bone className="mt-4 h-1.5 w-full rounded-full" />
                <Bone className="mt-4 h-10 w-full rounded-xl" />
              </Surface>
            ))}
          </div>
        </div>
        <Surface>
          <Bone className="mb-3 h-5 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="mb-2 h-6 w-full last:mb-0" />
          ))}
        </Surface>
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  const { isPro } = useEmployerShell();
  return isPro ? <ProDashboardSkeleton /> : <FreeDashboardSkeleton />;
}
