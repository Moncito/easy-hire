"use client";

import type { ReactNode } from "react";
import Bone from "@/components/employer/skeletons/Bone";
import EmployerSkeletonSurface from "@/components/employer/skeletons/EmployerSkeletonSurface";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <EmployerSkeletonSurface className={className}>{children}</EmployerSkeletonSurface>;
}

function ProReportsSkeleton() {
  return (
    <div className="pb-6">
      <ProPageHeaderSkeleton actions={3} />
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="pro-card flex flex-col overflow-hidden p-0">
            <div className="px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <Bone className="h-3 w-20" />
              <Bone className="mt-3 h-9 w-16" />
              <Bone className="mt-2 h-3 w-full" />
            </div>
            <div className="bg-ink/[0.04] px-5 py-4 sm:px-6">
              <Bone className="h-10 w-full" />
            </div>
          </article>
        ))}
      </div>
      <div className="mb-8 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="pro-card overflow-hidden p-0 xl:col-span-2">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-5 w-40" />
            <Bone className="mt-2 h-3 w-48" />
          </div>
          <div className="px-4 pb-5 pt-4">
            <Bone className="h-[220px] w-full rounded-xl" />
          </div>
        </div>
        <div className="pro-card overflow-hidden p-0">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-5 w-32" />
            <Bone className="mt-2 h-3 w-36" />
          </div>
          <div className="px-5 py-6">
            <Bone className="h-10 w-full rounded-full" />
          </div>
        </div>
      </div>
      <div className="pro-card overflow-hidden !p-0">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <Bone className="h-3 w-16" />
          <Bone className="mt-2 h-5 w-36" />
        </div>
        <div className="space-y-3 px-5 py-5 sm:px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Bone className="h-4 w-40" />
              <Bone className="ml-auto h-4 w-8" />
              <Bone className="h-4 w-8" />
              <Bone className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FreeReportsSkeleton() {
  return (
    <>
      <Bone className="mb-2 h-4 w-32" />
      <Bone className="mb-1 h-8 w-48" />
      <Bone className="mb-4 h-4 w-72" />
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Surface key={i}>
            <Bone className="h-3 w-16" />
            <Bone className="mt-3 h-7 w-12" />
            <Bone className="mt-2 h-8 w-full" />
          </Surface>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Surface>
          <Bone className="mb-4 h-5 w-40" />
          <Bone className="h-36 w-full rounded-xl" />
        </Surface>
        <Surface>
          <Bone className="mb-3 h-4 w-24" />
          <Bone className="h-20 w-full" />
        </Surface>
      </div>
    </>
  );
}

export default function ReportsSkeleton() {
  const { isPro } = useEmployerShell();
  return isPro ? <ProReportsSkeleton /> : <FreeReportsSkeleton />;
}
