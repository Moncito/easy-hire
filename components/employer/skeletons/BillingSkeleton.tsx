"use client";

import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

/** Mirrors BillingOverview: plan card, four usage tiles, payment and details, invoices. */
function OverviewSkeleton({ surface }: { surface: string }) {
  const card = `${surface} p-5 sm:p-6`;
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
            <div key={i} className={`${surface} px-4 py-3.5`}>
              <Bone className="h-3 w-20" />
              <Bone className="mt-2 h-6 w-10" />
              <Bone className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
      <section className={card}>
        <Bone className="h-4 w-44" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mt-3 flex justify-between gap-4">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-3.5 w-40" />
          </div>
        ))}
      </section>
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
      <OverviewSkeleton surface="pro-card" />
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
      <OverviewSkeleton surface="rounded-2xl border border-ink/10 bg-white" />
    </>
  );
}

export default function BillingSkeleton() {
  const { isPro } = useEmployerShell();
  return isPro ? <ProBillingSkeleton /> : <FreeBillingSkeleton />;
}
