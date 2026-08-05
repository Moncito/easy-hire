import Bone from "@/components/employer/skeletons/Bone";
import EmployerShellSkeleton from "@/components/employer/skeletons/EmployerShellSkeleton";

export default function ProfileSkeleton() {
  return (
    <EmployerShellSkeleton>
      <div className="mb-8 flex items-center gap-4 rounded-2xl bg-ink/[0.02] p-6">
        <Bone className="h-16 w-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-6 w-48" />
          <Bone className="h-3 w-32" />
          <Bone className="mt-2 h-2 w-full max-w-xs rounded-full" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 border-b border-ink/5 pb-6">
              <Bone className="h-4 w-28" />
              <Bone className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Bone className="hidden h-64 rounded-2xl lg:block" />
      </div>
    </EmployerShellSkeleton>
  );
}

export function ListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <EmployerShellSkeleton>
      <div className="divide-y divide-ink/5 rounded-2xl border border-ink/5 bg-white/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-52" />
              <Bone className="h-3 w-28" />
            </div>
            <Bone className="h-2 w-20 rounded-full" />
            <Bone className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </EmployerShellSkeleton>
  );
}
