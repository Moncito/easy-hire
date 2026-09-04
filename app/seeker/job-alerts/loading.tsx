import { SeekerListPageSkeleton } from "@/components/seeker/SeekerPageSkeletons";

export default function Loading() {
  return (
    <SeekerListPageSkeleton
      titleWidth="w-40"
      subtitleWidth="w-72"
      rowCount={3}
      variant="compact"
    />
  );
}
