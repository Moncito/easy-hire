import { unstable_cache, revalidateTag } from "next/cache";
import { seekerApplicationsTag, seekerInterviewsTag, seekerNotificationsTag } from "@/lib/seeker/cache-tags";
import {
  getSeekerNotifications,
  getUnreadNotificationCount,
} from "@/lib/notifications";

const NOTIFICATIONS_REVALIDATE = 15;

/** Drop the cached applications view for one seeker (call after apply/withdraw/status-change). */
export function invalidateSeekerApplications(userId: string) {
  revalidateTag(seekerApplicationsTag(userId), "max");
}

/** Drop the cached interviews view for one seeker (call after schedule/reschedule/cancel — see lib/collaborative-interviews.ts). */
export function invalidateSeekerInterviews(userId: string) {
  revalidateTag(seekerInterviewsTag(userId), "max");
}

export function getSeekerNotificationsCached(
  userId: string,
  params: { cursor?: string; limit: number }
) {
  const cacheKey = `${params.limit}:${params.cursor ?? ""}`;
  return unstable_cache(
    async () => {
      const [{ notifications, nextCursor }, unreadCount] = await Promise.all([
        getSeekerNotifications(userId, params),
        getUnreadNotificationCount(userId),
      ]);
      return { notifications, nextCursor, unreadCount };
    },
    [`seeker-notifications`, userId, cacheKey],
    { revalidate: NOTIFICATIONS_REVALIDATE, tags: [seekerNotificationsTag(userId)] }
  )();
}

/** Drop the cached notifications view for one seeker (call after a write or mark-read). */
export function invalidateSeekerNotifications(userId: string) {
  revalidateTag(seekerNotificationsTag(userId), "max");
}
