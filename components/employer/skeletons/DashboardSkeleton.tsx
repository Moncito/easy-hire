"use client";

import type { ReactNode } from "react";
import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <EmployerSkeletonSurface className={className}>{children}</EmployerSkeletonSurface>;
}

function ProDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      <header className="flex flex-col gap-4 border-b border-ink/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 gap-4">
          <Bone className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1">
            <Bone className="h-9 w-64 max-w-full sm:h-10" />
            <Bone className="mt-2 h-4 w-48 max-w-full" />
            <div className="mt-2 flex gap-3">
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-36" />
            </div>
            <Bone className="mt-3 h-4 w-72 max-w-full" />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Bone className="h-11 w-32 rounded-full" />
          <Bone className="h-11 w-40 rounded-full" />
        </div>
      </header>

      <div className="flex gap-2 overflow-hidden">
        <Bone className="h-9 w-40 shrink-0 rounded-full" />
        <Bone className="h-9 w-36 shrink-0 rounded-full" />
      </div>

      <section>
        <Bone className="h-6 w-40" />
        <Bone className="mt-1.5 h-4 w-56" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pro-card p-4">
              <Bone className="h-9 w-9 rounded-xl" />
              <Bone className="mt-3 h-4 w-24" />
              <Bone className="mt-2 h-3 w-full" />
              <Bone className="mt-1 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="pro-card p-5 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <Bone className="h-6 w-28" />
              <Bone className="mt-2 h-4 w-52" />
            </div>
            <Bone className="h-4 w-24" />
          </div>
          <div className="flex gap-4">
            <Bone className="h-3 w-24" />
            <Bone className="h-3 w-20" />
          </div>
          <Bone className="mt-4 h-[220px] w-full rounded-xl" />
          <div className="mt-4 flex gap-6 border-t border-ink/[0.06] pt-4">
            <Bone className="h-4 w-32" />
            <Bone className="h-4 w-28" />
          </div>
        </div>
        <aside className="pro-card flex flex-col justify-center p-5 sm:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-ink/[0.06] py-3.5 last:border-0 last:pb-0 first:pt-0">
              <Bone className="h-3 w-20" />
              <Bone className="mt-2 h-8 w-14" />
            </div>
          ))}
        </aside>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Bone className="h-6 w-32" />
            <Bone className="mt-2 h-4 w-56" />
          </div>
          <Bone className="h-4 w-20" />
        </div>
        <div className="pro-card overflow-hidden !p-0">
          <div className="grid grid-cols-6 gap-3 border-b border-ink/[0.06] px-5 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bone key={i} className="h-3 w-12" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 items-center gap-3 border-b border-ink/[0.06] px-5 py-4 last:border-0">
              <Bone className="col-span-2 h-4 w-40" />
              <Bone className="h-4 w-8 justify-self-end" />
              <Bone className="h-4 w-8 justify-self-end" />
              <Bone className="h-4 w-8 justify-self-end" />
              <Bone className="h-8 w-20 justify-self-end rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <div className="pro-card p-5 sm:p-6">
          <Bone className="h-5 w-24" />
          <Bone className="mt-2 h-4 w-40" />
          <Bone className="mt-6 h-10 w-full rounded-full" />
        </div>
        <div className="pro-card p-5 sm:p-6">
          <Bone className="mb-4 h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-3 flex gap-3 last:mb-0">
              <Bone className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-20" />
              </div>
            </div>
          ))}
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
