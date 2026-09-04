import { SeekerListPageSkeleton } from "@/components/seeker/SeekerPageSkeletons";

export default function Loading() {
  return (
    <SeekerListPageSkeleton
      titleWidth="w-48"
      subtitleWidth="w-64"
      showSearchBar
      filterPillCount={4}
      rowCount={3}
      variant="detailed"
    />
  );
}
