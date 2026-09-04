/** Cache tag helpers for public, anonymous-cacheable browse data (used with unstable_cache / revalidateTag). */

export function publicJobsListTag() {
  return "public-jobs-list";
}

export function publicJobTag(jobId: string) {
  return `public-job-${jobId}`;
}

export function publicCompanyTag(companyId: string) {
  return `public-company-${companyId}`;
}

export function publicSeekerTag(seekerId: string) {
  return `public-seeker-${seekerId}`;
}
