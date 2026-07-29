import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ jobs: [], companies: [] });
  }

  const now = new Date();

  const [jobs, companies] = await Promise.all([
    prisma.job.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        company: { verifiedStatus: "APPROVED" },
        title: { contains: q, mode: "insensitive" },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        title: true,
        location: true,
        company: { select: { companyName: true } },
      },
    }),
    prisma.company.findMany({
      where: {
        verifiedStatus: "APPROVED",
        companyName: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, companyName: true, logoUrl: true },
    }),
  ]);

  return NextResponse.json(
    {
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company.companyName,
        location: j.location,
      })),
      companies: companies.map((c) => ({ id: c.id, name: c.companyName, logoUrl: c.logoUrl })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
