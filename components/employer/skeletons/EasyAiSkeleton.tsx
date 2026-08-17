import Bone from "@/components/employer/skeletons/Bone";
import ProPageHeaderSkeleton from "@/components/employer/skeletons/ProPageHeaderSkeleton";

export default function EasyAiSkeleton() {
  return (
    <div>
      <ProPageHeaderSkeleton actions={1} stats={0} />
      <div className="pro-card mb-6 p-5 sm:p-6">
        <Bone className="h-4 w-32" />
        <Bone className="mt-3 h-2 w-full rounded-full" />
        <Bone className="mt-3 h-3 w-48" />
      </div>
      <Bone className="mb-3 h-4 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pro-card flex flex-col gap-2 p-5">
            <Bone className="h-10 w-10 rounded-xl" />
            <Bone className="mt-1 h-4 w-28" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
