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
    <div className="flex flex-col gap-5 pb-8">
      {/* Header: logo, name + meta, range control and two buttons */}
      <header className="flex flex-wrap items-center gap-3.5">
        <Bone className="h-12 w-12 shrink-0 rounded-control" />
        <div className="space-y-2">
          <Bone className="h-6 w-60 max-w-full" />
          <Bone className="h-3.5 w-44" />
        </div>
        <div className="flex flex-wrap gap-2 min-[521px]:ml-auto">
          <Bone className="h-9 w-32 rounded-control" />
          <Bone className="h-9 w-36 rounded-control" />
          <Bone className="h-9 w-28 rounded-control" />
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 min-[521px]:grid-cols-2 min-[861px]:grid-cols-3 min-[1181px]:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-h-[118px] rounded-card border border-eh-line bg-eh-surface px-[18px] py-4">
            <Bone className="h-3.5 w-24" />
            <Bone className="mt-3 h-8 w-12" />
            <Bone className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Applications chart (2/3) + pipeline funnel (1/3) */}
      <div className="grid grid-cols-1 gap-3 min-[1181px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-card border border-eh-line bg-eh-surface p-5">
          <Bone className="h-5 w-40" />
          <Bone className="mt-4 h-[220px] w-full rounded-control" />
        </section>
        <section className="rounded-card border border-eh-line bg-eh-surface p-5">
          <Bone className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="mt-5 h-[26px] w-full rounded-[6px]" />
          ))}
        </section>
      </div>

      {/* Decision queue (2/3) + recent activity (1/3) */}
      <div className="grid grid-cols-1 items-start gap-3 min-[1181px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-card border border-eh-line bg-eh-surface p-5">
          <Bone className="h-5 w-44" />
          <div className="mt-4 flex items-center gap-3.5 rounded-card border border-eh-line p-3.5">
            <Bone className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-56 max-w-full" />
            </div>
            <Bone className="h-[30px] w-48 rounded-control" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="mt-4 flex items-center gap-3">
              <Bone className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-36" />
                <Bone className="h-5 w-64 max-w-full rounded-chip" />
              </div>
            </div>
          ))}
        </section>
        <section className="rounded-card border border-eh-line bg-eh-surface p-5">
          <Bone className="mb-4 h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-3 flex gap-2.5 last:mb-0">
              <Bone className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-16" />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Active roles table */}
      <section className="rounded-card border border-eh-line bg-eh-surface">
        <div className="flex items-center gap-2.5 px-5 pb-3.5 pt-4">
          <Bone className="h-5 w-28" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-7 gap-3 border-y border-eh-line bg-eh-surface-2 px-5 py-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-3 w-14" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 items-center gap-3 border-b border-eh-line px-5 py-3 last:border-0">
            <div className="col-span-2 space-y-1.5">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-28" />
            </div>
            <Bone className="h-4 w-8 justify-self-end" />
            <Bone className="h-4 w-8 justify-self-end" />
            <Bone className="h-4 w-12 justify-self-end" />
            <Bone className="h-4 w-10 justify-self-end" />
            <Bone className="h-[30px] w-28 justify-self-end rounded-control" />
          </div>
        ))}
      </section>
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
