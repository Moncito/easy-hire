import Bone from "@/components/employer/skeletons/Bone";
import EmployerShellSkeleton from "@/components/employer/skeletons/EmployerShellSkeleton";

type Props = {
  inline?: boolean;
};

function ApplicantsHubSkeletonContent({ rows = 6 }: { rows?: number }) {
  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex items-baseline gap-3">
          <Bone className="h-8 w-36" />
          <Bone className="h-4 w-16" />
        </div>
        <Bone className="h-4 w-64" />
        <Bone className="h-4 w-80 max-w-full" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Bone className="h-10 w-full max-w-md rounded-xl" />
        <Bone className="h-10 w-40 rounded-xl" />
      </div>
      <div className="border-t border-ink/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 border-b border-ink/5 px-2 py-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-56" />
              <Bone className="h-3 w-40" />
              <Bone className="h-1.5 w-full max-w-xs rounded-full sm:hidden" />
            </div>
            <Bone className="hidden h-4 w-16 sm:block" />
            <Bone className="hidden h-1.5 w-28 rounded-full md:block" />
            <Bone className="h-4 w-4 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function ApplicantsHubSkeleton({ inline }: Props = {}) {
  if (inline) {
    return <ApplicantsHubSkeletonContent />;
  }

  return (
    <EmployerShellSkeleton>
      <ApplicantsHubSkeletonContent rows={8} />
    </EmployerShellSkeleton>
  );
}
