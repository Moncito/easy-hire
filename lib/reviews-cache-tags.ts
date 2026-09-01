/** Cache tag helpers for two-way review reads (used with unstable_cache / revalidateTag). */

export function companyReviewsTag(companyId: string) {
  return `company-reviews-${companyId}`;
}

export function seekerReviewsTag(seekerId: string) {
  return `seeker-reviews-${seekerId}`;
}
