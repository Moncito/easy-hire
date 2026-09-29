"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

/** Mirrors BillingOverview: plan card, four usage tiles, payment + details, invoices. */
function OverviewSkeleton({ card }: { card: string }) {
  return (
    <div className="space-y-5">
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Bone className="h-7 w-44" />
            <Bone className="h-4 w-64" />
          </div>
          <Bone className="h-10 w-36 rounded-xl" />
        </div>
      </section>
      <div>
        <Bone className="mb-3 h-4 w-16" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-ink/[0.03] px-4 py-4">
              <Bone className="h-2.5 w-20" />
              <Bone className="mt-2.5 h-7 w-12" />
              <Bone className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <section key={i} className={card}>
            <Bone className="h-4 w-32" />
            <Bone className="mt-4 h-3.5 w-full max-w-xs" />
            <Bone className="mt-2 h-3.5 w-48" />
          </section>
        ))}
      </div>
      <section className={card}>
        <Bone className="h-4 w-40" />
        <Bone className="mt-5 h-3.5 w-72" />
      </section>
    </div>
  );
}

function ProBillingSkeleton() {
  return (
    <div className="pb-6">
      <ProPageHeaderSkeleton actions={0} />
      <OverviewSkeleton card="pro-card p-5 sm:p-6" />
      <section className="pro-card mt-5 p-5 sm:p-6">
        <Bone className="h-4 w-44" />
        <Bone className="mt-2 h-3.5 w-32" />
      </section>
    </div>
  );
}

function FreeBillingSkeleton() {
  return (
    <>
      <Bone className="mb-1 h-8 w-32" />
      <Bone className="mb-6 h-4 w-80" />
      <OverviewSkeleton card="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6" />
    </>
  );
}

export default function BillingSkeleton() {
  const { isPro } = useEmployerShell();
  return isPro ? <ProBillingSkeleton /> : <FreeBillingSkeleton />;
}
