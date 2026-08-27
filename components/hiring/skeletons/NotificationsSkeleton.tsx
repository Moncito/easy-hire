import Bone from "@/components/employer/skeletons/Bone";

export default function NotificationsSkeleton() {
  return (
    <div>
      <header className="border-b border-ink/10 pb-5">
        <Bone className="h-3 w-40" />
        <Bone className="mt-2 h-8 w-48" />
      </header>
      <div className="mt-5 divide-y border-y border-ink/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-4">
            <Bone className="h-4 w-4/5" />
            <Bone className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
