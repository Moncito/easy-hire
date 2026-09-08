import { SeekerListPageSkeleton } from "@/components/seeker/SeekerPageSkeletons";

export default function Loading() {
  return (
    <SeekerListPageSkeleton
      titleWidth="w-52"
      subtitleWidth="w-72"
      rowCount={6}
      variant="compact"
    />
  );
}
