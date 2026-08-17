import Bone from "@/components/employer/skeletons/Bone";

type Props = {
  actions?: number;
  stats?: number;
};

/** Mirrors `ProPageHeader` — large display title, description, stats, pill actions. */
export default function ProPageHeaderSkeleton({ actions = 1, stats = 3 }: Props) {
  return (
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <Bone className="h-10 w-52 sm:h-12 sm:w-72" />
        <Bone className="mt-3 h-4 w-full max-w-xl" />
        {stats > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {Array.from({ length: stats }).map((_, i) => (
              <Bone key={i} className="h-4 w-20" />
            ))}
          </div>
        )}
      </div>
      {actions > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2.5">
          {Array.from({ length: actions }).map((_, i) => (
            <Bone key={i} className="h-11 w-32 rounded-full" />
          ))}
        </div>
      )}
    </header>
  );
}
