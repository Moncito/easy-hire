import { revalidateTag } from "next/cache";
import { publicJobTag, publicJobsListTag } from "@/lib/public-cache-tags";

/**
 * Kept in its own file (no dependency on public-listing.ts, which imports
 * from lib/jobs/featured.ts) so mutation call sites like lib/jobs/featured.ts
 * can invalidate the public cache without creating an import cycle.
 */
export function invalidatePublicJobsList() {
  revalidateTag(publicJobsListTag(), "max");
}

export function invalidatePublicJob(jobId: string) {
  revalidateTag(publicJobTag(jobId), "max");
}
