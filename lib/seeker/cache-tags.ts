/** Cache tag helpers for seeker-side data (used with unstable_cache / revalidateTag). */

export function seekerProfileTag(userId: string) {
  return `seeker-profile-${userId}`;
}

export function seekerApplicationsTag(userId: string) {
  return `seeker-applications-${userId}`;
}

export function seekerSavedJobsTag(userId: string) {
  return `seeker-saved-jobs-${userId}`;
}

export function seekerJobAlertsTag(userId: string) {
  return `seeker-job-alerts-${userId}`;
}
