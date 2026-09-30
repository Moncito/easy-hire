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

export function JobCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-2 h-3.5 w-32" />
      <div className="mt-5 flex gap-6">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="mt-5 h-9 w-full rounded-control" />
    </Card>
  );
}
