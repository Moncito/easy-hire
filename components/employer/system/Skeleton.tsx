import { Card } from "@/components/employer/system/Card";
import { cx } from "@/components/employer/system/cx";

/** Base shimmer block. Uses the workspace shimmer, which respects the theme. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("employer-shimmer employer-ws-bone rounded-chip", className)} aria-hidden="true" />;
}

export function MetricCardSkeleton() {
  return (
    <Card as="div" padded={false} className="min-h-[120px] px-5 py-4">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-3 h-8 w-14" />
      <Skeleton className="mt-4 h-3 w-32" />
    </Card>
  );
}

export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-eh-line px-5 py-3.5 last:border-0">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      {Array.from({ length: Math.max(0, columns - 2) }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-10" />
      ))}
      <Skeleton className="h-8 w-24 rounded-control" />
    </div>
  );
}

export function CandidateRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-52 max-w-full" />
      </div>
      <Skeleton className="h-8 w-40 rounded-control" />
    </div>
  );
}

export function AnalyticsCardSkeleton({ height = 220 }: { height?: number }) {
  return (
    <Card>
      <Skeleton className="h-5 w-40" />
      <div style={{ height }} className="mt-5 employer-shimmer employer-ws-bone rounded-control" aria-hidden="true" />
    </Card>
  );
}

export function PipelineSkeleton({ stages = 4 }: { stages?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: stages }).map((_, i) => (
        <div key={i} className="grid grid-cols-[92px_1fr_40px] items-center gap-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-6 justify-self-end" />
        </div>
      ))}
    </div>
  );
}

/** Mirrors JobCard: title, meta, salary, three numbers, pipeline, action row. */
export function JobCardSkeleton() {
  return (
    <Card as="div" padded={false} className="flex min-h-[300px] flex-col p-5">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-2 h-3.5 w-1/2" />
      <Skeleton className="mt-1.5 h-3.5 w-1/3" />
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-eh-line pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-6 w-10" />
            <Skeleton className="mt-1.5 h-3 w-14" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
      <div className="mt-auto flex gap-2 pt-5">
        <Skeleton className="h-9 flex-1 rounded-control" />
        <Skeleton className="h-9 w-9 rounded-control" />
      </div>
    </Card>
  );
}