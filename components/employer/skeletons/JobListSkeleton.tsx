import Bone from "@/components/employer/skeletons/Bone";
import EmployerShellSkeleton from "@/components/employer/skeletons/EmployerShellSkeleton";

type Props = {
  inline?: boolean;
};

function JobCardsGrid() {
  return (
    <>
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Bone className="h-10 max-w-md flex-1 rounded-xl" />
        <Bone className="h-10 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <Bone className="h-5 w-3/4" />
            <Bone className="mt-2 h-3 w-1/2" />
            <div className="mt-4 flex gap-4">
              <Bone className="h-8 w-12" />
              <Bone className="h-8 w-12" />
            </div>
            <Bone className="mt-4 h-1.5 w-full rounded-full" />
            <Bone className="mt-4 h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function JobListSkeleton({ inline }: Props) {
  if (inline) {
    return <JobCardsGrid />;
  }

  return (
    <EmployerShellSkeleton>
      <div className="mb-6 space-y-2">
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-64" />
      </div>
      <JobCardsGrid />
    </EmployerShellSkeleton>
  );
}
