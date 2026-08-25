import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import type { z } from "zod";
import type { hiringSetupSchema } from "@/lib/validations/hiring-setup";

const DEFAULT_CRITERIA = ["Skills", "Relevant experience", "Communication", "Role fit"];
type SetupInput = z.infer<typeof hiringSetupSchema>;

export async function getHiringSetup(companyId: string, actorUserId: string, jobId: string) {
  await requireCompanyMembership(companyId, actorUserId, "jobs:manage");
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    select: {
      id: true, title: true,
      teamMembers: { select: { memberId: true } },
      scorecardTemplates: { where: { isActive: true }, orderBy: { updatedAt: "desc" }, take: 1, include: { criteria: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!job) throw new ApiError("Job not found", 404);
  const members = await prisma.companyMember.findMany({ where: { companyId, status: "ACTIVE" }, include: { user: { select: { email: true } } }, orderBy: [{ role: "asc" }, { joinedAt: "asc" }] });
  return { job, members, template: job.scorecardTemplates[0] ?? null };
}

export async function saveHiringSetup(companyId: string, actorUserId: string, jobId: string, input: SetupInput) {
  await requireCompanyMembership(companyId, actorUserId, "jobs:manage");
  const job = await prisma.job.findFirst({ where: { id: jobId, companyId }, select: { id: true } });
  if (!job) throw new ApiError("Job not found", 404);
  const members = await prisma.companyMember.findMany({ where: { companyId, status: "ACTIVE", id: { in: input.memberIds } }, select: { id: true } });
  if (members.length !== new Set(input.memberIds).size) throw new ApiError("A selected team member does not belong to this company.", 400);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.scorecardTemplate.findFirst({ where: { jobId, isActive: true }, include: { evaluations: { select: { id: true }, take: 1 } } });
    if (existing?.evaluations.length) throw new ApiError("The active scorecard already has evaluations and cannot be changed.", 400);
    const template = existing
      ? await tx.scorecardTemplate.update({ where: { id: existing.id }, data: { title: input.title, instructions: input.instructions ?? null } })
      : await tx.scorecardTemplate.create({ data: { jobId, title: input.title, instructions: input.instructions ?? null } });
    await tx.scorecardCriterion.deleteMany({ where: { templateId: template.id } });
    await tx.scorecardCriterion.createMany({ data: input.criteria.map((criterion, sortOrder) => ({ templateId: template.id, label: criterion.label, description: criterion.description ?? null, sortOrder })) });
    await tx.jobTeamMember.deleteMany({ where: { jobId } });
    if (members.length) await tx.jobTeamMember.createMany({ data: members.map((member) => ({ jobId, memberId: member.id })) });
    return tx.scorecardTemplate.findUniqueOrThrow({ where: { id: template.id }, include: { criteria: { orderBy: { sortOrder: "asc" } } } });
  });
}

export { DEFAULT_CRITERIA };
