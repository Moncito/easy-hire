import Bone from "@/components/employer/skeletons/Bone";

type Props = {
  count?: number;
};

/** Mirrors Pro perk strips — 3 compact pro-cards with icon + copy. */
export default function ProPerkStripSkeleton({ count = 3 }: Props) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pro-card flex gap-3 p-4">
          <Bone className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-4 w-28" />
            <Bone className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
