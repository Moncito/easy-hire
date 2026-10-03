import { prisma } from "@/lib/prisma";
import { formatOfferRate } from "@/lib/hiring/offer-state";

export type HireListItem = {
  applicationId: string;
  hiredAt: string;
  hireSource: "OFFER_ACCEPTED" | "EMPLOYER_MARKED" | null;
  confirmedBySeekerAt: string | null;
  seekerName: string;
  seekerProfileId: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  offer: { rateLabel: string; startDate: string | null } | null;
};

export type HireStats = {
  total: number;
  viaOffer: number;
  employerMarked: number;
  unknownSource: number;
  confirmedBySeeker: number;
  guaranteeInterest: number;
};

export type HireRow = {
  id: string;
  hiredAt: Date | null;
  hireSource: "OFFER_ACCEPTED" | "EMPLOYER_MARKED" | null;
  hireConfirmedBySeekerAt: Date | null;
  seeker: { id: string; fullName: string };
  job: { id: string; title: string; company: { id: string; companyName: string } };
  offers: Array<{
    monthlyRateCents: number | null;
    hourlyRateCents: number | null;
    currency: string;
    startDate: Date | null;
  }>;
};

export function toHireListItem(row: HireRow): HireListItem {
  const offer = row.offers[0] ?? null;
  return {
    applicationId: row.id,
    hiredAt: (row.hiredAt ?? new Date(0)).toISOString(),
    hireSource: row.hireSource,
    confirmedBySeekerAt: row.hireConfirmedBySeekerAt?.toISOString() ?? null,
    seekerName: row.seeker.fullName,
    seekerProfileId: row.seeker.id,
    companyId: row.job.company.id,
    companyName: row.job.company.companyName,
    jobId: row.job.id,
    jobTitle: row.job.title,
    offer: offer
      ? {
          rateLabel: formatOfferRate(offer),
          startDate: offer.startDate ? offer.startDate.toISOString().slice(0, 10) : null,
        }
      : null,
  };
}

export async function listHires(params: { limit?: number }): Promise<HireListItem[]> {
  const rows = await prisma.application.findMany({
    where: { hiredAt: { not: null } },
    orderBy: { hiredAt: "desc" },
    take: Math.min(params.limit ?? 100, 200),
    select: {
      id: true,
      hiredAt: true,
      hireSource: true,
      hireConfirmedBySeekerAt: true,
      seeker: { select: { id: true, fullName: true } },
      job: {
        select: {
          id: true,
          title: true,
          company: { select: { id: true, companyName: true } },
        },
      },
      offers: {
        where: { status: "ACCEPTED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          monthlyRateCents: true,
          hourlyRateCents: true,
          currency: true,
          startDate: true,
        },
      },
    },
  });
  return rows.map(toHireListItem);
}

export async function getHireStats(): Promise<HireStats> {
  const hired = { hiredAt: { not: null } } as const;
  const [total, viaOffer, employerMarked, confirmedBySeeker, interestGroups] = await Promise.all([
    prisma.application.count({ where: hired }),
    prisma.application.count({ where: { ...hired, hireSource: "OFFER_ACCEPTED" } }),
    prisma.application.count({ where: { ...hired, hireSource: "EMPLOYER_MARKED" } }),
    prisma.application.count({ where: { ...hired, hireConfirmedBySeekerAt: { not: null } } }),
    prisma.platformEvent.groupBy({
      by: ["entityId"],
      where: { eventType: "HIRE_GUARANTEE_INTEREST" },
    }),
  ]);
  return {
    total,
    viaOffer,
    employerMarked,
    unknownSource: total - viaOffer - employerMarked,
    confirmedBySeeker,
    guaranteeInterest: interestGroups.length,
  };
}
