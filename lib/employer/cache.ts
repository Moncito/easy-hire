import { unstable_cache, revalidateTag } from "next/cache";
import { getEmployerNavCounts, getEmployerAnalytics } from "@/lib/employer-analytics";
import { getEmployerJobsWithMetrics } from "@/lib/employer-jobs";
import { searchTalent } from "@/lib/talent";
import {
  employerAnalyticsTag,
  employerJobsTag,
  employerNavTag,
  employerNotificationsTag,
  employerTalentSearchTag,
} from "@/lib/employer-cache-tags";
import {
  getEmployerNotifications,
  getUnreadNotificationCount,
} from "@/lib/notifications";

const NAV_REVALIDATE = 30;
const JOBS_REVALIDATE = 60;
const ANALYTICS_REVALIDATE = 60;

export function getEmployerNavCountsCached(companyId: string) {
  return unstable_cache(
    async () => getEmployerNavCounts(companyId),
    [`employer-nav-counts`, companyId],
    { revalidate: NAV_REVALIDATE, tags: [employerNavTag(companyId)] }
  )();
}

export function getEmployerJobsWithMetricsCached(companyId: string) {
  return unstable_cache(
    async () => getEmployerJobsWithMetrics(companyId),
    [`employer-jobs-metrics`, companyId],
    { revalidate: JOBS_REVALIDATE, tags: [employerJobsTag(companyId)] }
  )();
}

export function getEmployerAnalyticsCached(companyId: string) {
  return unstable_cache(
    async () => getEmployerAnalytics(companyId),
    [`employer-analytics`, companyId],
    { revalidate: ANALYTICS_REVALIDATE, tags: [employerAnalyticsTag(companyId)] }
  )();
}

/** Bust nav, jobs list, and dashboard analytics for one company. */
export function invalidateEmployerWorkspace(companyId: string) {
  revalidateTag(employerNavTag(companyId), "max");
  revalidateTag(employerJobsTag(companyId), "max");
  revalidateTag(employerAnalyticsTag(companyId), "max");
}

export function invalidateEmployerNav(companyId: string) {
  revalidateTag(employerNavTag(companyId), "max");
}

export function invalidateEmployerJobs(companyId: string) {
  revalidateTag(employerJobsTag(companyId), "max");
}

export function invalidateEmployerAnalytics(companyId: string) {
  revalidateTag(employerAnalyticsTag(companyId), "max");
}

export function searchTalentCached(employerUserId: string, params: Record<string, string>) {
  const queryKey = JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, string>
      )
  );

  return unstable_cache(
    async () => searchTalent(employerUserId, params),
    [`employer-talent-search`, employerUserId, queryKey],
    { revalidate: 30, tags: [employerTalentSearchTag(`${employerUserId}:${queryKey}`)] }
  )();
}

export function getEmployerNotificationsCached(userId: string) {
  return unstable_cache(
    async () => {
      const [notifications, unreadCount] = await Promise.all([
        getEmployerNotifications(userId),
        getUnreadNotificationCount(userId),
      ]);
      return { notifications, unreadCount };
    },
    [`employer-notifications`, userId],
    { revalidate: 15, tags: [employerNotificationsTag(userId)] }
  )();
}

export function invalidateEmployerNotifications(userId: string) {
  revalidateTag(employerNotificationsTag(userId), "max");
}
