import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { deleteStorageObject, type BucketId } from "@/lib/storage";
import { parseResume } from "@/lib/seeker-profile-format";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";
import { invalidateCompanyMembership, invalidateHiringWorkspaces } from "@/lib/collaborative-hiring";
import { invalidateSeekerApplications } from "@/lib/seeker/cache";

/**
 * ACCOUNT DELETION — CASCADE DESIGN NOTES
 * =========================================
 * We never call `prisma.user.delete()`. The schema's `onDelete: Cascade`
 * chain from User -> SeekerProfile/Company -> Application/Conversation/
 * Message/CandidateEvaluation/Interview/SavedSeeker/SavedTalentListItem
 * would let Postgres silently hard-delete rows the *other* party in a
 * hiring relationship still legitimately relies on (an employer's reviewed
 * Application, a shared Conversation thread, a teammate's CandidateEvaluation).
 * So deletion here means: anonymize the User/SeekerProfile/Company rows in
 * place (keep the id, so every FK pointing at them stays valid), hard-delete
 * only rows that are purely the user's own, and run the whole thing inside
 * one `$transaction` so a mid-way failure can't leave a half-anonymized
 * account. See the parent task's cascade map in the handoff report.
 */

export const ACCOUNT_DELETION_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

const DELETED_EMAIL_DOMAIN = "deleted.easyhire.invalid";

export type AccountDeletionCredentials = {
  /** Required when the account has a password (Credentials sign-up). */
  password?: string;
  /** Required instead of `password` for Google-only accounts (passwordHash === null). */
  confirmation?: string;
};

export type AccountDeletionResult = {
  seekerAnonymized: boolean;
  companyAnonymized: boolean;
  membershipsRemoved: number;
  jobsClosed: number;
};

/**
 * Pure guard — no DB access, cheap to unit test. Mirrors the guard style in
 * lib/collaborative-hiring-team.ts (removeCompanyMember's "at least one
 * owner" check), but for account deletion the rule is stricter: a sole
 * owner can't delete themselves out from under teammates who still depend
 * on that workspace at all, active in any role.
 */
export function assertCanDeleteOwnedCompany(input: {
  ownsCompany: boolean;
  otherActiveMemberCount: number;
}): void {
  if (input.ownsCompany && input.otherActiveMemberCount > 0) {
    throw new ApiError(
      "You are the sole owner of a company with other active team members. Transfer ownership before deleting your account.",
      409
    );
  }
}

export type StorageDeletionTarget = { bucket: BucketId; path: string };

/**
 * Pure helper — no DB access, cheap to unit test (same rationale as
 * assertCanDeleteOwnedCompany above). Collects the public-bucket profile
 * images (company logo/banner, seeker photo, user avatar) that need to be
 * removed from storage on account deletion. Stored values may carry a
 * `?v=` cache-buster suffix — that's stripped downstream by `toObjectPath`,
 * not here, so this function just passes the raw stored value through.
 */
export function collectProfileImageStorageTargets(input: {
  companyLogoUrl?: string | null;
  companyBannerUrl?: string | null;
  seekerPhotoUrl?: string | null;
  avatarUrl?: string | null;
}): StorageDeletionTarget[] {
  const targets: StorageDeletionTarget[] = [];
  if (input.companyLogoUrl) targets.push({ bucket: "logos", path: input.companyLogoUrl });
  if (input.companyBannerUrl) targets.push({ bucket: "banners", path: input.companyBannerUrl });
  if (input.seekerPhotoUrl) targets.push({ bucket: "photos", path: input.seekerPhotoUrl });
  if (input.avatarUrl) targets.push({ bucket: "photos", path: input.avatarUrl });
  return targets;
}

async function assertReauthenticated(
  user: { passwordHash: string | null },
  credentials: AccountDeletionCredentials
): Promise<void> {
  if (user.passwordHash) {
    if (!credentials.password) {
      throw new ApiError("Enter your current password to confirm account deletion.", 400);
    }
    const valid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!valid) {
      throw new ApiError("Incorrect password.", 401);
    }
    return;
  }

  // Google-only account — no password to check. Require an explicit typed
  // confirmation instead (mirrors the "type DELETE to confirm" pattern).
  const typed = credentials.confirmation?.trim().toUpperCase();
  if (typed !== ACCOUNT_DELETION_CONFIRMATION_PHRASE) {
    throw new ApiError(
      `Type "${ACCOUNT_DELETION_CONFIRMATION_PHRASE}" to confirm deleting your Google-linked account.`,
      400
    );
  }
}

function anonymizedEmail(userId: string) {
  return `deleted-${userId}-${Date.now()}@${DELETED_EMAIL_DOMAIN}`;
}

export async function deleteUserAccount(
  userId: string,
  credentials: AccountDeletionCredentials
): Promise<AccountDeletionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { seekerProfile: true, company: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  await assertReauthenticated(user, credentials);

  // Plain reads, gathered before the transaction — storage deletion happens
  // after commit (see below), so these paths just need to be captured now
  // while the rows still exist.
  const resumePaths = user.seekerProfile
    ? Array.from(
        new Set(
          [user.seekerProfile.resumeUrl, ...user.seekerProfile.resumes.map((raw) => parseResume(raw).url)].filter(
            (v): v is string => Boolean(v)
          )
        )
      )
    : [];

  const verificationDocuments = user.company
    ? await prisma.verificationDocument.findMany({
        where: { companyId: user.company.id },
        select: { fileUrl: true },
      })
    : [];

  const profileImageTargets = collectProfileImageStorageTargets({
    companyLogoUrl: user.company?.logoUrl,
    companyBannerUrl: user.company?.bannerUrl,
    seekerPhotoUrl: user.seekerProfile?.photoUrl,
    avatarUrl: user.avatarUrl,
  });

  let membershipCompanyIds: string[] = [];

  const result = await prisma.$transaction(async (tx) => {
    let companyAnonymized = false;
    let jobsClosed = 0;

    if (user.company) {
      // Authoritative guard — re-checked here (not just before the
      // transaction) so a concurrent membership change can't race past it.
      const otherActiveMemberCount = await tx.companyMember.count({
        where: { companyId: user.company.id, status: "ACTIVE", userId: { not: userId } },
      });
      assertCanDeleteOwnedCompany({ ownsCompany: true, otherActiveMemberCount });

      // Purely the company's own housekeeping data — no counterparty reads it.
      await tx.verificationDocument.deleteMany({ where: { companyId: user.company.id } });
      await tx.savedSeeker.deleteMany({ where: { companyId: user.company.id } });
      await tx.aiUsageEvent.deleteMany({ where: { companyId: user.company.id } });
      await tx.savedTalentList.deleteMany({ where: { companyId: user.company.id } });
      await tx.analyticsDailyRollup.deleteMany({ where: { companyId: user.company.id } });

      // Jobs stay (Applications/Conversations/CandidateEvaluations/Interviews
      // hang off them) — just close them so they stop taking applicants.
      const closed = await tx.job.updateMany({
        where: { companyId: user.company.id, status: { not: "CLOSED" } },
        data: { status: "CLOSED" },
      });
      jobsClosed = closed.count;

      await tx.company.update({
        where: { id: user.company.id },
        data: {
          companyName: "Deleted company",
          logoUrl: null,
          bannerUrl: null,
          description: null,
          website: null,
          industry: null,
          teamSize: null,
          foundedYear: null,
          headquarters: null,
          highlights: [],
          linkedinUrl: null,
          facebookUrl: null,
          instagramUrl: null,
          xUrl: null,
          verificationRejectionReason: null,
        },
      });
      companyAnonymized = true;
    }

    // Soft-remove every active membership this user holds, in their own
    // company (handled above) and in any other company they were invited
    // into as a teammate — never hard-delete CompanyMember rows, since that
    // would cascade-delete CandidateEvaluation/Interview/JobTeamMember rows
    // those companies' hiring workspaces still rely on.
    const memberships = await tx.companyMember.findMany({
      where: { userId, status: "ACTIVE" },
      select: { companyId: true },
    });
    membershipCompanyIds = memberships.map((m) => m.companyId);
    if (membershipCompanyIds.length > 0) {
      await tx.companyMember.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "REMOVED" },
      });
    }

    let seekerAnonymized = false;
    if (user.seekerProfile) {
      // Purely the seeker's own — safe to hard-delete.
      await tx.savedJob.deleteMany({ where: { seekerId: user.seekerProfile.id } });
      await tx.jobAlert.deleteMany({ where: { seekerId: user.seekerProfile.id } });

      // Cover notes are the seeker's own free-text content — blank them,
      // but keep the Application row so the employer's pipeline history
      // (status, rating, internal notes, screening answers) stays intact.
      await tx.application.updateMany({
        where: { seekerId: user.seekerProfile.id },
        data: { coverNote: null },
      });

      await tx.seekerProfile.update({
        where: { id: user.seekerProfile.id },
        data: {
          fullName: "Deleted user",
          phone: null,
          location: null,
          headline: null,
          bio: null,
          resumeUrl: null,
          skills: [],
          desiredSalaryMin: null,
          desiredSalaryMax: null,
          visibility: "HIDDEN",
          availability: null,
          yearsExperience: null,
          linkedinUrl: null,
          portfolioUrl: null,
          certifications: [],
          photoUrl: null,
          languages: [],
          workExperience: [],
          education: [],
          resumeLabel: null,
          resumeUpdatedAt: null,
          resumes: [],
        },
      });
      seekerAnonymized = true;
    }

    // Purely the user's own — safe to hard-delete regardless of role.
    await tx.notification.deleteMany({ where: { userId } });
    await tx.verificationToken.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail(userId),
        passwordHash: null,
        avatarUrl: null,
        emailVerifiedAt: null,
      },
    });

    return { seekerAnonymized, companyAnonymized, membershipsRemoved: membershipCompanyIds.length, jobsClosed };
  });

  // Storage cleanup happens after the DB transaction commits and is
  // best-effort (see deletePrivateStorageObject) — Supabase Storage isn't
  // part of Postgres's transaction, and a slow/flaky network call must never
  // hold the DB transaction open or roll back data that's already anonymized.
  await Promise.all([
    ...resumePaths.map((path) => deleteStorageObject("resumes", path)),
    ...verificationDocuments.map((doc) => deleteStorageObject("verification-docs", doc.fileUrl)),
    ...profileImageTargets.map((target) => deleteStorageObject(target.bucket, target.path)),
  ]);

  if (user.company) {
    invalidateEmployerWorkspace(user.company.id);
  }
  if (user.seekerProfile) {
    invalidateSeekerApplications(userId);
  }
  for (const companyId of membershipCompanyIds) {
    invalidateCompanyMembership(companyId, userId);
  }
  invalidateHiringWorkspaces(userId);

  return result;
}
