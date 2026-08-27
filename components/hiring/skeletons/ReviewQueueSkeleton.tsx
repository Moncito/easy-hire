import Bone from "@/components/employer/skeletons/Bone";

export default function ReviewQueueSkeleton() {
  return (
    <div>
      <Bone className="h-3 w-24" />
      <Bone className="mt-2 h-8 w-72" />
      <Bone className="mt-2 h-4 w-56" />
      <div className="mt-6 divide-y border-y border-ink/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-5">
            <div>
              <Bone className="h-4 w-48" />
              <Bone className="mt-2 h-3 w-24" />
            </div>
            <Bone className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
