import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://easyhire.ph";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/employers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/signup`, changeFrequency: "monthly", priority: 0.5 },
  ];

  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "ACTIVE", company: { verifiedStatus: "APPROVED" } },
      select: { id: true, updatedAt: true },
      take: 500,
      orderBy: { updatedAt: "desc" },
    });
    jobRoutes = jobs.map((job) => ({
      url: `${BASE}/jobs/${job.id}`,
      lastModified: job.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // DB may be unavailable during build — static routes still emit
  }

  return [...staticRoutes, ...jobRoutes];
}
