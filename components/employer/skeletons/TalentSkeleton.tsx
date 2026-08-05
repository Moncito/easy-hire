import Bone from "@/components/employer/skeletons/Bone";
import EmployerShellSkeleton from "@/components/employer/skeletons/EmployerShellSkeleton";

export default function TalentSkeleton() {
  return (
    <EmployerShellSkeleton>
      <Bone className="mb-6 h-11 w-full max-w-xl rounded-full" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="divide-y divide-ink/5 rounded-2xl border border-ink/5 bg-white/40">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Bone className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-56" />
            </div>
            <Bone className="h-4 w-20" />
          </div>
        ))}
      </div>
    </EmployerShellSkeleton>
  );
}
