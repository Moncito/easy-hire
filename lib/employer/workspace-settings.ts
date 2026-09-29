import { prisma } from "@/lib/prisma";
import { getCompanySubscription } from "@/lib/billing/subscriptions";
import { getOwnershipTransferState } from "@/lib/company-ownership-transfer";

/**
 * Read-only summaries behind the Workspace group in employer Settings
 * (Company, Team, Plan & billing). Each section shows where things stand and
 * links to the page that edits them — Settings never duplicates those forms.
 * One loader per section so a page load only queries what it shows.
 */

export type TeamSettingsSummary = {
  teammates: number;
  pendingInvitations: number;
  pendingOwnerEmail: string | null;
};

export async function getTeamSettingsSummary(companyId: string, ownerUserId: string): Promise<TeamSettingsSummary> {
  const [teammates, pendingInvitations, transfer] = await Promise.all([
    prisma.companyMember.count({ where: { companyId, status: "ACTIVE", userId: { not: ownerUserId } } }),
    prisma.companyInvitation.count({
      where: { companyId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    getOwnershipTransferState(ownerUserId),
  ]);
  return { teammates, pendingInvitations, pendingOwnerEmail: transfer.pending?.email ?? null };
}

export type BillingSettingsSummary = {
  status: "ACTIVE" | "CANCELLED" | "PAST_DUE" | null;
  currentPeriodEnd: Date | null;
};

export async function getBillingSettingsSummary(companyId: string): Promise<BillingSettingsSummary> {
  const subscription = await getCompanySubscription(companyId);
  return {
    status: subscription?.status ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };
}
