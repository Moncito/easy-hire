import Bone from "@/components/employer/skeletons/Bone";
import EmployerShellSkeleton from "@/components/employer/skeletons/EmployerShellSkeleton";

export default function JobFormSkeleton() {
  return (
    <EmployerShellSkeleton>
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 border-b border-ink/5 pb-8">
              <Bone className="h-5 w-32" />
              <Bone className="h-3 w-64" />
              <Bone className="h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="hidden space-y-4 lg:block">
          <Bone className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </EmployerShellSkeleton>
  );
}
