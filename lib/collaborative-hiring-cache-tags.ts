/** Cache tag helpers for the collaborative /hiring workspace (used with unstable_cache / revalidateTag). */

export function companyMembershipTag(companyId: string, userId: string) {
  return `company-membership-${companyId}-${userId}`;
}

export function hiringWorkspacesTag(userId: string) {
  return `hiring-workspaces-${userId}`;
}

export function companyBrandingTag(companyId: string) {
  return `company-branding-${companyId}`;
}

export function companyQueueTag(companyId: string) {
  return `company-queue-${companyId}`;
}
