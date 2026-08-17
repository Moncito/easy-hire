"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import ProPerkStripSkeleton from "@/components/employer/skeletons/ProPerkStripSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

function ProBillingSkeleton() {
  return (
    <div className="pb-6">
      <ProPageHeaderSkeleton actions={0} />
      <ProPerkStripSkeleton />
      <section className="pro-card mb-5 overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Bone className="h-5 w-40" />
            <Bone className="h-4 w-56" />
          </div>
          <Bone className="h-6 w-16 rounded-full" />
        </div>
        <Bone className="mt-5 h-10 w-40 rounded-full" />
      </section>
      <section className="pro-card p-5 sm:p-6">
        <Bone className="mb-4 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-4 w-4 rounded" />
              <Bone className="h-4 w-48" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FreeBillingSkeleton() {
  return (
    <>
      <Bone className="mb-1 h-8 w-32" />
      <Bone className="mb-6 h-4 w-80" />
      <div className="mb-4 rounded-2xl border border-ink/8 bg-white/90 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Bone className="h-2.5 w-24" />
              <Bone className="mt-2 h-6 w-20" />
              <Bone className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-ink/8 bg-white/90">
        <div className="border-b border-ink/6 px-6 py-4">
          <Bone className="h-5 w-48" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 border-b border-ink/5 px-6 py-3 last:border-0">
            <Bone className="h-4 w-full max-w-[200px]" />
            <Bone className="mx-auto h-4 w-4 rounded-full" />
            <Bone className="mx-auto h-4 w-4 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function BillingSkeleton() {
  const { isPro } = useEmployerShell();
  return isPro ? <ProBillingSkeleton /> : <FreeBillingSkeleton />;
}
