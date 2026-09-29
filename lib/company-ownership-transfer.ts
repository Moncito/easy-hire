import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { invalidateCompanyMembership, invalidateHiringWorkspaces } from "@/lib/collaborative-hiring";
import { invalidateCollaboratorQueue } from "@/lib/collaborative-hiring-team";
import { invalidateEmployerWorkspace } from "@/lib/employer/cache";
import { sendOwnershipTransferAcceptedEmail, sendOwnershipTransferOfferEmail } from "@/lib/email";

/**
 * COMPANY OWNERSHIP TRANSFER
 * ==========================
 * A company belongs to exactly one user (`Company.userId` is unique) and only
 * EMPLOYER accounts reach /employer/*. Handing a company over therefore means
 * moving `Company.userId`, and, when the new owner has a job-seeker account,
 * turning that account into an employer account.
 *
 * Because it changes someone else's account type, it's a two-step offer:
 *  1. The owner nominates an ACTIVE team member and re-authenticates.
 *  2. The nominee accepts (or declines) from /hiring.
 *
 * On acceptance, in one transaction: `Company.userId` moves, the nominee's
 * membership becomes OWNER, the previous owner's becomes RECRUITER, and a
 * SEEKER nominee becomes EMPLOYER. Their SeekerProfile is untouched: the data
 * stays, the /seeker area just stops admitting them while they're EMPLOYER.
 *
 * The previous owner keeps an EMPLOYER account with no company. On their next
 * /employer visit ensureEmployerCompany creates a fresh draft company, exactly
 * as it does for any employer without one. They reach the transferred company
 * through /hiring like any other teammate.
 */

export const OWNERSHIP_TRANSFER_TTL_DAYS = 7;
export const OWNERSHIP_TRANSFER_CONFIRMATION_PHRASE = "TRANSFER OWNERSHIP";

const TTL_MS = OWNERSHIP_TRANSFER_TTL_DAYS * 24 * 60 * 60 * 1000;

type PendingFields = { pendingOwnerUserId: string | null; ownerTransferRequestedAt: Date | null };

export function ownershipTransferExpiresAt(requestedAt: Date): Date {
  return new Date(requestedAt.getTime() + TTL_MS);
}

/** Pure. An offer counts only while both fields are set and it hasn't lapsed. */
export function isOwnershipTransferPending(company: PendingFields, now: Date = new Date()): boolean {
  if (!company.pendingOwnerUserId || !company.ownerTransferRequestedAt) return false;
  return ownershipTransferExpiresAt(company.ownerTransferRequestedAt) > now;
}

/**
 * Pure. Who may be offered a company. Checked when the offer is made and again,
 * inside the transaction, when it's accepted.
 */
export function assertCanReceiveOwnership(input: {
  isActiveMember: boolean;
  isCurrentOwner: boolean;
  accountRole: "SEEKER" | "EMPLOYER" | "ADMIN";
  ownsCompany: boolean;
}): void {
  if (input.isCurrentOwner) throw new ApiError("You already own this company.", 400);
  if (!input.isActiveMember) throw new ApiError("Only an active member of this hiring team can become its owner.", 400);
  if (input.accountRole === "ADMIN") throw new ApiError("EasyHire admin accounts can't own a company.", 400);
  if (input.ownsCompany) {
    throw new ApiError("This teammate already owns a company on EasyHire, and an account can own only one.", 409);
  }
}

async function assertOwnerReauthenticated(
  owner: { passwordHash: string | null },
  credentials: { password?: string; confirmation?: string }
) {
  if (owner.passwordHash) {
    if (!credentials.password) throw new ApiError("Enter your current password to confirm.", 400);
    if (!(await bcrypt.compare(credentials.password, owner.passwordHash))) {
      throw new ApiError("Incorrect password.", 401);
    }
    return;
  }
  if (credentials.confirmation?.trim().toUpperCase() !== OWNERSHIP_TRANSFER_CONFIRMATION_PHRASE) {
    throw new ApiError(`Type "${OWNERSHIP_TRANSFER_CONFIRMATION_PHRASE}" to confirm.`, 400);
  }
}

async function requireOwnedCompany(ownerUserId: string) {
  const company = await prisma.company.findUnique({ where: { userId: ownerUserId } });
  if (!company) throw new ApiError("Company not found", 404);
  return company;
}

export type OwnershipTransferState = {
  pending: { email: string; requestedAt: Date; expiresAt: Date } | null;
  candidates: Array<{ memberId: string; email: string; isSeeker: boolean; ownsCompany: boolean }>;
};

/** What the owner's Team page needs: any live offer, and who could receive one. */
export async function getOwnershipTransferState(ownerUserId: string): Promise<OwnershipTransferState> {
  const company = await requireOwnedCompany(ownerUserId);
  const members = await prisma.companyMember.findMany({
    where: { companyId: company.id, status: "ACTIVE", userId: { not: ownerUserId } },
    select: { id: true, user: { select: { id: true, email: true, role: true, company: { select: { id: true } } } } },
    orderBy: { joinedAt: "asc" },
  });

  let pending: OwnershipTransferState["pending"] = null;
  if (isOwnershipTransferPending(company)) {
    const nominee = members.find((m) => m.user.id === company.pendingOwnerUserId);
    // A nominee who has since left the team can't accept, so there's nothing to show.
    if (nominee) {
      pending = {
        email: nominee.user.email,
        requestedAt: company.ownerTransferRequestedAt!,
        expiresAt: ownershipTransferExpiresAt(company.ownerTransferRequestedAt!),
      };
    }
  }

  return {
    pending,
    candidates: members
      .filter((m) => m.user.role !== "ADMIN")
      .map((m) => ({
        memberId: m.id,
        email: m.user.email,
        isSeeker: m.user.role === "SEEKER",
        ownsCompany: Boolean(m.user.company),
      })),
  };
}

export async function requestOwnershipTransfer(
  ownerUserId: string,
  input: { memberId: string; password?: string; confirmation?: string }
) {
  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { email: true, passwordHash: true },
  });
  if (!owner) throw new ApiError("User not found", 404);
  await assertOwnerReauthenticated(owner, input);

  const company = await requireOwnedCompany(ownerUserId);
  const member = await prisma.companyMember.findFirst({
    where: { id: input.memberId, companyId: company.id },
    select: { status: true, user: { select: { id: true, email: true, role: true, company: { select: { id: true } } } } },
  });
  if (!member) throw new ApiError("Team member not found", 404);

  assertCanReceiveOwnership({
    isActiveMember: member.status === "ACTIVE",
    isCurrentOwner: member.user.id === ownerUserId,
    accountRole: member.user.role,
    ownsCompany: Boolean(member.user.company),
  });

  // Replaces any earlier offer — one company, one open offer.
  await prisma.company.update({
    where: { id: company.id },
    data: { pendingOwnerUserId: member.user.id, ownerTransferRequestedAt: new Date() },
  });

  await sendOwnershipTransferOfferEmail({
    to: member.user.email,
    companyName: company.companyName || "a company",
    fromEmail: owner.email,
    willConvertToEmployer: member.user.role === "SEEKER",
  });
}

export async function cancelOwnershipTransfer(ownerUserId: string) {
  const company = await requireOwnedCompany(ownerUserId);
  await prisma.company.update({
    where: { id: company.id },
    data: { pendingOwnerUserId: null, ownerTransferRequestedAt: null },
  });
}

export type OwnershipOffer = {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  fromEmail: string;
  expiresAt: Date;
  willConvertToEmployer: boolean;
};

/** Live offers waiting on this user, for the prompt on /hiring. */
export async function listOwnershipOffersForUser(userId: string): Promise<OwnershipOffer[]> {
  const [user, companies] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.company.findMany({
      where: {
        pendingOwnerUserId: userId,
        ownerTransferRequestedAt: { gt: new Date(Date.now() - TTL_MS) },
        members: { some: { userId, status: "ACTIVE" } },
      },
      select: {
        id: true,
        companyName: true,
        logoUrl: true,
        ownerTransferRequestedAt: true,
        user: { select: { email: true } },
      },
    }),
  ]);
  return companies.map((c) => ({
    companyId: c.id,
    companyName: c.companyName || "Unnamed company",
    logoUrl: c.logoUrl,
    fromEmail: c.user.email,
    expiresAt: ownershipTransferExpiresAt(c.ownerTransferRequestedAt!),
    willConvertToEmployer: user?.role === "SEEKER",
  }));
}

export async function acceptOwnershipTransfer(userId: string, companyId: string) {
  const { previousOwner, companyName, newOwnerEmail } = await prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        companyName: true,
        userId: true,
        pendingOwnerUserId: true,
        ownerTransferRequestedAt: true,
        user: { select: { email: true } },
      },
    });
    if (!company || company.pendingOwnerUserId !== userId || !isOwnershipTransferPending(company)) {
      throw new ApiError("This ownership offer is no longer available.", 400);
    }

    const [nominee, nomineeMembership] = await Promise.all([
      tx.user.findUnique({ where: { id: userId }, select: { email: true, role: true, company: { select: { id: true } } } }),
      tx.companyMember.findFirst({ where: { companyId, userId, status: "ACTIVE" }, select: { id: true } }),
    ]);
    if (!nominee) throw new ApiError("User not found", 404);

    // Re-checked here: the nominee may have created or been given a company
    // since the offer was made.
    assertCanReceiveOwnership({
      isActiveMember: Boolean(nomineeMembership),
      isCurrentOwner: company.userId === userId,
      accountRole: nominee.role,
      ownsCompany: Boolean(nominee.company),
    });

    await tx.company.update({
      where: { id: companyId },
      data: { userId, pendingOwnerUserId: null, ownerTransferRequestedAt: null },
    });
    await tx.companyMember.update({ where: { id: nomineeMembership!.id }, data: { role: "OWNER" } });
    await tx.companyMember.upsert({
      where: { companyId_userId: { companyId, userId: company.userId } },
      create: { companyId, userId: company.userId, role: "RECRUITER", status: "ACTIVE" },
      update: { role: "RECRUITER", status: "ACTIVE" },
    });
    if (nominee.role === "SEEKER") {
      await tx.user.update({ where: { id: userId }, data: { role: "EMPLOYER" } });
    }

    return {
      previousOwner: { id: company.userId, email: company.user.email },
      companyName: company.companyName || "Your company",
      newOwnerEmail: nominee.email,
    };
  });

  invalidateEmployerWorkspace(companyId);
  invalidateCollaboratorQueue(companyId);
  for (const id of [userId, previousOwner.id]) {
    invalidateCompanyMembership(companyId, id);
    invalidateHiringWorkspaces(id);
  }

  await sendOwnershipTransferAcceptedEmail({ to: previousOwner.email, companyName, newOwnerEmail });
}

export async function declineOwnershipTransfer(userId: string, companyId: string) {
  const result = await prisma.company.updateMany({
    where: { id: companyId, pendingOwnerUserId: userId },
    data: { pendingOwnerUserId: null, ownerTransferRequestedAt: null },
  });
  if (!result.count) throw new ApiError("This ownership offer is no longer available.", 400);
}
