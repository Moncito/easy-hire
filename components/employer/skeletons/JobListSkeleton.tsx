import Bone from "@/components/employer/skeletons/Bone";
import EmployerShellSkeleton from "@/components/employer/skeletons/EmployerShellSkeleton";

export default function JobListSkeleton() {
  return (
    <EmployerShellSkeleton>
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="divide-y divide-ink/5 rounded-2xl border border-ink/5 bg-white/40">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4">
            <div className="space-y-2">
              <Bone className="h-4 w-56" />
              <Bone className="h-3 w-36" />
            </div>
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-4 w-8" />
            <Bone className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </EmployerShellSkeleton>
  );
}
