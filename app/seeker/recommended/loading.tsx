import { SeekerListPageSkeleton } from "@/components/seeker/SeekerPageSkeletons";

export default function Loading() {
  return (
    <SeekerListPageSkeleton
      titleWidth="w-56"
      subtitleWidth="w-72"
      showSignalChips
      filterPillCount={4}
      rowCount={5}
      variant="detailed"
    />
  );
}
