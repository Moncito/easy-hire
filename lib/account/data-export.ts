import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { RESUME_BUCKET, VERIFICATION_DOC_BUCKET, resolveSignedUrl } from "@/lib/storage";
import { parseResume } from "@/lib/seeker-profile-format";
import { getEmployerCompanyByUserId } from "@/lib/auth/employer-company";

/**
 * Data-subject export for RA 10173 (Data Privacy Act). Everything genuinely
 * belonging to this user, plus just enough context from a shared record
 * (a conversation counterpart's display name, a job title) to make the
 * export legible — never another user's profile, email, or phone.
 *
 * `passwordHash` is never selected. `tokenHash` (verification_tokens,
 * company_invitations) is never selected — those are opaque secrets, not
 * data about the person. Employer subscription rows are exported as plan
 * metadata only — never stripeCustomerId/stripeSubscriptionId.
 */

async function buildSeekerExport(
  seekerProfile: NonNullable<Awaited<ReturnType<typeof prisma.seekerProfile.findUnique>>>,
  userId: string
) {
  const seekerId = seekerProfile.id;

  const [resumeUrl, resumes, applications, savedJobs, jobAlerts, conversations] = await Promise.all([
    resolveSignedUrl(RESUME_BUCKET, seekerProfile.resumeUrl),
    Promise.all(
      seekerProfile.resumes.map(async (raw) => {
        const parsed = parseResume(raw);
        return {
          label: parsed.label,
          updatedAt: parsed.updatedAt,
          downloadUrl: await resolveSignedUrl(RESUME_BUCKET, parsed.url),
        };
      })
    ),
    prisma.application.findMany({
      where: { seekerId },
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        status: true,
        coverNote: true,
        rejectionReason: true,
        appliedAt: true,
        updatedAt: true,
        job: { select: { id: true, title: true, company: { select: { companyName: true } } } },
        answers: {
          select: { answerText: true, question: { select: { prompt: true } } },
        },
      },
    }),
    prisma.savedJob.findMany({
      where: { seekerId },
      orderBy: { savedAt: "desc" },
      select: {
        savedAt: true,
        job: { select: { id: true, title: true, company: { select: { companyName: true } } } },
      },
    }),
    prisma.jobAlert.findMany({ where: { seekerId }, orderBy: { createdAt: "desc" } }),
    prisma.conversation.findMany({
      where: { seekerId },
      orderBy: { lastMessageAt: "desc" },
      select: {
        id: true,
        lastMessageAt: true,
        company: { select: { companyName: true } },
        job: { select: { title: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, body: true, createdAt: true, senderUserId: true },
        },
      },
    }),
  ]);

  return {
    profile: {
      fullName: seekerProfile.fullName,
      phone: seekerProfile.phone,
      location: seekerProfile.location,
      headline: seekerProfile.headline,
      bio: seekerProfile.bio,
      skills: seekerProfile.skills,
      desiredSalaryMin: seekerProfile.desiredSalaryMin,
      desiredSalaryMax: seekerProfile.desiredSalaryMax,
      visibility: seekerProfile.visibility,
      availability: seekerProfile.availability,
      yearsExperience: seekerProfile.yearsExperience,
      linkedinUrl: seekerProfile.linkedinUrl,
      portfolioUrl: seekerProfile.portfolioUrl,
      certifications: seekerProfile.certifications,
      languages: seekerProfile.languages,
      timezone: seekerProfile.timezone,
      workExperience: seekerProfile.workExperience,
      education: seekerProfile.education,
      resumeLabel: seekerProfile.resumeLabel,
      resumeUpdatedAt: seekerProfile.resumeUpdatedAt,
      resumeDownloadUrl: resumeUrl,
      resumes,
      createdAt: seekerProfile.createdAt,
      updatedAt: seekerProfile.updatedAt,
    },
    applications: applications.map((a) => ({
      id: a.id,
      status: a.status,
      coverNote: a.coverNote,
      rejectionReason: a.rejectionReason,
      appliedAt: a.appliedAt,
      updatedAt: a.updatedAt,
      jobTitle: a.job.title,
      companyName: a.job.company.companyName,
      screeningAnswers: a.answers.map((ans) => ({ question: ans.question.prompt, answer: ans.answerText })),
    })),
    savedJobs: savedJobs.map((s) => ({
      savedAt: s.savedAt,
      jobTitle: s.job.title,
      companyName: s.job.company.companyName,
    })),
    jobAlerts,
    conversations: conversations.map((c) => ({
      id: c.id,
      withCompany: c.company.companyName,
      jobTitle: c.job?.title ?? null,
      lastMessageAt: c.lastMessageAt,
      messages: c.messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        sentByMe: m.senderUserId === userId,
      })),
    })),
  };
}

async function buildEmployerExport(
  company: NonNullable<Awaited<ReturnType<typeof prisma.company.findUnique>>>,
  userId: string
) {
  const companyId = company.id;

  const [jobs, verificationDocuments, memberships, subscriptions, conversations, savedTalentLists] =
    await Promise.all([
      prisma.job.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } }),
      prisma.verificationDocument.findMany({
        where: { companyId },
        orderBy: { uploadedAt: "desc" },
        select: { id: true, fileName: true, docType: true, uploadedAt: true, fileUrl: true },
      }),
      prisma.companyMember.findMany({
        where: { userId },
        orderBy: { joinedAt: "desc" },
        select: {
          role: true,
          status: true,
          joinedAt: true,
          company: { select: { id: true, companyName: true } },
        },
      }),
      prisma.subscription.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        select: { planType: true, status: true, currentPeriodEnd: true, createdAt: true },
      }),
      prisma.conversation.findMany({
        where: { companyId },
        orderBy: { lastMessageAt: "desc" },
        select: {
          id: true,
          lastMessageAt: true,
          seeker: { select: { fullName: true } },
          job: { select: { title: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, body: true, createdAt: true, senderUserId: true },
          },
        },
      }),
      prisma.savedTalentList.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          items: {
            select: { note: true, addedAt: true, seeker: { select: { fullName: true } } },
          },
        },
      }),
    ]);

  const verificationDocumentsExport = await Promise.all(
    verificationDocuments.map(async (doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      docType: doc.docType,
      uploadedAt: doc.uploadedAt,
      downloadUrl: await resolveSignedUrl(VERIFICATION_DOC_BUCKET, doc.fileUrl),
    }))
  );

  return {
    company: {
      companyName: company.companyName,
      description: company.description,
      website: company.website,
      industry: company.industry,
      verifiedStatus: company.verifiedStatus,
      verificationRejectionReason: company.verificationRejectionReason,
      teamSize: company.teamSize,
      foundedYear: company.foundedYear,
      headquarters: company.headquarters,
      highlights: company.highlights,
      linkedinUrl: company.linkedinUrl,
      facebookUrl: company.facebookUrl,
      instagramUrl: company.instagramUrl,
      xUrl: company.xUrl,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    },
    jobs,
    verificationDocuments: verificationDocumentsExport,
    teamMemberships: memberships.map((m) => ({
      companyId: m.company.id,
      companyName: m.company.companyName,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    })),
    // Metadata only — never stripeCustomerId/stripeSubscriptionId.
    subscriptions,
    conversations: conversations.map((c) => ({
      id: c.id,
      withSeeker: c.seeker.fullName,
      jobTitle: c.job?.title ?? null,
      lastMessageAt: c.lastMessageAt,
      messages: c.messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        sentByMe: m.senderUserId === userId,
      })),
    })),
    savedTalentLists: savedTalentLists.map((list) => ({
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      items: list.items.map((item) => ({
        seekerName: item.seeker.fullName,
        note: item.note,
        addedAt: item.addedAt,
      })),
    })),
  };
}

export async function buildUserDataExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const [notifications, seekerProfile, company] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.seekerProfile.findUnique({ where: { userId } }),
    prisma.company.findUnique({ where: { userId } }),
  ]);

  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    user,
    notifications,
  };

  if (seekerProfile) {
    payload.seeker = await buildSeekerExport(seekerProfile, userId);
  }

  if (company) {
    payload.employer = await buildEmployerExport(company, userId);
  }

  return payload;
}

/**
 * Writes an export audit entry, mirroring lib/employer/exports.ts
 * (kind + meta only — the meta payload never carries the exported PII).
 *
 * NOTE: ExportAuditLog.companyId is NOT NULL, so a seeker's self-export
 * (no company) can't be written to this table without a schema change.
 * That's a product-owner decision per CLAUDE.md, so for now seeker exports
 * are only recorded via a server log line — flagged in the handoff report.
 */
export async function logAccountDataExport(userId: string): Promise<void> {
  const company = await getEmployerCompanyByUserId(userId);

  if (!company) {
    console.info(
      `[account-export] user ${userId} exported their own account data (no company — not written to ExportAuditLog)`
    );
    return;
  }

  await prisma.exportAuditLog.create({
    data: {
      companyId: company.id,
      userId,
      kind: "account_data_export",
      meta: { self: true },
    },
  });
}
