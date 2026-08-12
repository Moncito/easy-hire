/** Cache tag helpers for employer workspace data (used with unstable_cache / revalidateTag). */

export function employerNavTag(companyId: string) {
  return `employer-nav-${companyId}`;
}

export function employerJobsTag(companyId: string) {
  return `employer-jobs-${companyId}`;
}

export function employerAnalyticsTag(companyId: string) {
  return `employer-analytics-${companyId}`;
}

export function employerTalentSearchTag(queryKey: string) {
  return `employer-talent-${queryKey}`;
}

export function employerNotificationsTag(userId: string) {
  return `employer-notifications-${userId}`;
}

export function conversationsListTag(userId: string) {
  return `conversations-list-${userId}`;
}
