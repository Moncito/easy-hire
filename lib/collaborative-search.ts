import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";

export type CollaborativeSearchResult = { type: "job" | "applicant"; id: string; label: string; sub?: string; href: string };

/** Workspace command-palette search, scoped to this company/membership — companion to lib/employer/analytics.ts's searchEmployerWorkspace, hrefs point into /hiring instead of /employer. */
export async function searchCollaborativeWorkspace(companyId: string, actorUserId: string, query: string): Promise<CollaborativeSearchResult[]> {
  await requireCompanyMembership(companyId, actorUserId, "team:read");
  const q = query.trim();
  if (q.length < 2) return [];

  const [jobs, applicants] = await Promise.all([
    prisma.job.findMany({
      where: { companyId, title: { contains: q, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, status: true },
    }),
    prisma.application.findMany({
      where: { job: { companyId }, seeker: { fullName: { contains: q, mode: "insensitive" } } },
      take: 5,
      select: { id: true, jobId: true, seeker: { select: { fullName: true } }, job: { select: { title: true } } },
    }),
  ]);

  return [
    ...jobs.map((j) => ({ type: "job" as const, id: j.id, label: j.title, sub: j.status.replace("_", " "), href: `/hiring/${companyId}/jobs/${j.id}` })),
    ...applicants.map((a) => ({ type: "applicant" as const, id: a.id, label: a.seeker.fullName, sub: a.job.title, href: `/hiring/${companyId}/jobs/${a.jobId}/applications/${a.id}` })),
  ];
}
