import { prisma } from "@/lib/prisma";

export type LandingStats = {
  openJobs: number;
  verifiedCompanies: number;
  seekers: number;
};

export type LandingCompany = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  industry: string | null;
};

export async function getLandingStats(): Promise<LandingStats> {
  try {
    const now = new Date();
    const [openJobs, verifiedCompanies, seekers] = await Promise.all([
      prisma.job.count({
        where: {
          AND: [
            { status: "ACTIVE" },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            { company: { verifiedStatus: "APPROVED" } },
          ],
        },
      }),
      prisma.company.count({ where: { verifiedStatus: "APPROVED" } }),
      prisma.seekerProfile.count(),
    ]);
    return { openJobs, verifiedCompanies, seekers };
  } catch {
    return { openJobs: 0, verifiedCompanies: 0, seekers: 0 };
  }
}

export async function listVerifiedCompanies(limit = 10): Promise<LandingCompany[]> {
  try {
    const companies = await prisma.company.findMany({
      where: { verifiedStatus: "APPROVED" },
      orderBy: [
        { logoUrl: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: limit,
      select: {
        id: true,
        companyName: true,
        logoUrl: true,
        industry: true,
      },
    });
    return companies;
  } catch {
    return [];
  }
}
