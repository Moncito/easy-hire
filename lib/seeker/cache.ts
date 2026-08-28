import { revalidateTag } from "next/cache";
import { seekerApplicationsTag } from "@/lib/seeker/cache-tags";

/** Drop the cached applications view for one seeker (call after apply/withdraw/status-change). */
export function invalidateSeekerApplications(userId: string) {
  revalidateTag(seekerApplicationsTag(userId), "max");
}
