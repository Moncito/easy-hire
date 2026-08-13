import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { createHash } from "crypto";

function dayStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function lastNDays(n: number) {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = dayStart(new Date());
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Hide noisy % swings when both periods have very little data */
function percentChange(current: number, previous: number, minTotal = 3): number | null {
  if (current + previous < minTotal) return null;
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export type AttentionItem = {
  id: string;
  label: string;
  href: string;
  priority: "high" | "normal";
};

export type RecentActivityItem = {
  id: string;
  seekerName: string;
  seekerPhotoUrl: string | null;
  jobTitle: string;
  jobId: string;
  appliedAt: string;
};

export type DailyCount = { date: string; count: number };

export type EmployerAnalytics = {
  hiringScore: number;
  scorePercentile: number | null;
  funnel: {
    applied: number;
    reviewed: number;
    interview: number;
    hired: number;
  };
  metrics: {
    activeJobs: number;
    totalApplicants: number;
    needsReview: number;
    appsToday: number;
    appsTodayChange: number | null;
    interviewsActive: number;
    interviewsChange: number | null;
    appsTodaySparkline: number[];
    interviewsSparkline: number[];
  };
  weeklyTrend: {
    applications: DailyCount[];
    interviews: DailyCount[];
  };
  insights: {
    actionRequired: string | null;
    marketInsight: string | null;
  };
  activeJobs: Array<{
    id: string;
    title: string;
    status: string;
    remoteType: string;
    location: string;
    applicantCount: number;
    viewCount: number;
    hiredCount: number;
    targetHireCount: number;
    needsAttention: boolean;
    updatedAt: string;
  }>;
  profileCompletion: number;
  newApplicantsThisWeek: number;
  companyVerified: boolean;
  unreadMessages: number;
  attentionItems: AttentionItem[];
  recentActivity: RecentActivityItem[];
};

function computeProfileCompletion(company: {
  companyName: string;
  description: string | null;
  industry: string | null;
  logoUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  highlights: string[];
}) {
  const checklist = [
    !!company.companyName,
    !!company.description,
    !!company.industry,
    !!company.logoUrl,
    !!(company.linkedinUrl || company.facebookUrl || company.instagramUrl || company.xUrl),
    company.highlights.length > 0,
  ];
  return Math.round((checklist.filter(Boolean).length / checklist.length) * 100);
}

function computeHiringScore(input: {
  profileCompletion: number;
  totalApplicants: number;
  reviewedCount: number;
  interviewCount: number;
  hiredCount: number;
  activeJobsWithApplicants: number;
  activeJobs: number;
}) {
  const profilePoints = Math.round((input.profileCompletion / 100) * 20);
  const reviewRate =
    input.totalApplicants > 0 ? input.reviewedCount / input.totalApplicants : 0;
  const reviewPoints = Math.round(reviewRate * 30);
  const pipelinePoints =
    input.interviewCount > 0 || input.hiredCount > 0 ? 25 : input.reviewedCount > 0 ? 12 : 0;
  const activityRate =
    input.activeJobs > 0 ? input.activeJobsWithApplicants / input.activeJobs : 0;
  const activityPoints = Math.round(activityRate * 25);
  return Math.min(100, profilePoints + reviewPoints + pipelinePoints + activityPoints);
}

async function computeScorePercentileUncached(score: number) {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      companyName: true,
      description: true,
      industry: true,
      logoUrl: true,
      linkedinUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      xUrl: true,
      highlights: true,
    },
  });

  if (companies.length < 5) return null;

  const scores = await Promise.all(
    companies.map(async (c) => {
      const [statusGroups, activeJobs, activeJobsWithApplicants] = await Promise.all([
        prisma.application.groupBy({
          by: ["status"],
          where: { job: { companyId: c.id } },
          _count: { _all: true },
        }),
        prisma.job.count({ where: { companyId: c.id, status: "ACTIVE" } }),
        prisma.job.count({
          where: {
            companyId: c.id,
            status: "ACTIVE",
            applications: { some: {} },
          },
        }),
      ]);

      const statusMap = Object.fromEntries(
        statusGroups.map((g) => [g.status, g._count._all])
      ) as Record<string, number>;

      const applied = statusMap.APPLIED ?? 0;
      const reviewedCount =
        (statusMap.SHORTLISTED ?? 0) +
        (statusMap.INTERVIEW ?? 0) +
        (statusMap.HIRED ?? 0) +
        (statusMap.REJECTED ?? 0);

      return computeHiringScore({
        profileCompletion: computeProfileCompletion(c),
        totalApplicants: applied + reviewedCount,
        reviewedCount,
        interviewCount: statusMap.INTERVIEW ?? 0,
        hiredCount: statusMap.HIRED ?? 0,
        activeJobsWithApplicants,
        activeJobs,
      });
    })
  );

  const below = scores.filter((s) => s < score).length;
  return Math.round((below / scores.length) * 100);
}

const computeScorePercentile = unstable_cache(
  async (score: number) => computeScorePercentileUncached(score),
  ["employer-score-percentile"],
  { revalidate: 300 }
);

export async function getEmployerAnalytics(companyId: string): Promise<EmployerAnalytics> {
  const now = new Date();
  const todayStart = dayStart(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const days = lastNDays(7);

  const [
    statusGroups,
    activeJobsCount,
    newApplicantsThisWeek,
    appsToday,
    appsYesterday,
    activeJobs,
    jobViewCounts,
    appsLastWeek,
    interviewsLastWeek,
    recentApplications,
    unreadMessages,
    interviewsPrevWeek,
  ] = await Promise.all([
    prisma.application.groupBy({
      by: ["status"],
      where: { job: { companyId } },
      _count: { _all: true },
    }),
    prisma.job.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.application.count({
      where: { job: { companyId }, appliedAt: { gte: weekAgo } },
    }),
    prisma.application.count({
      where: { job: { companyId }, appliedAt: { gte: todayStart } },
    }),
    prisma.application.count({
      where: {
        job: { companyId },
        appliedAt: { gte: yesterdayStart, lt: todayStart },
      },
    }),
    prisma.job.findMany({
      where: { companyId, status: { in: ["ACTIVE", "PENDING_REVIEW"] } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        _count: { select: { applications: true } },
      },
    }),
    prisma.jobView.groupBy({
      by: ["jobId"],
      where: { job: { companyId } },
      _count: { _all: true },
    }),
    prisma.application.findMany({
      where: { job: { companyId }, appliedAt: { gte: weekAgo } },
      select: { appliedAt: true },
    }),
    prisma.application.findMany({
      where: {
        job: { companyId },
        status: { in: ["INTERVIEW", "HIRED"] },
        updatedAt: { gte: weekAgo },
      },
      select: { updatedAt: true },
    }),
    prisma.application.findMany({
      where: { job: { companyId } },
      orderBy: { appliedAt: "desc" },
      take: 6,
      include: {
        seeker: { select: { fullName: true, photoUrl: true } },
        job: { select: { id: true, title: true } },
      },
    }),
    prisma.message.count({
      where: {
        conversation: { companyId },
        readAt: null,
        sender: { role: "SEEKER" },
      },
    }),
    prisma.application.count({
      where: {
        job: { companyId },
        status: { in: ["INTERVIEW", "HIRED"] },
        updatedAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
  ]);

  const activeJobIds = activeJobs.map((j) => j.id);
  const [pipelineByJob, staleAppliedByJob] =
    activeJobIds.length > 0
      ? await Promise.all([
          prisma.application.groupBy({
            by: ["jobId", "status"],
            where: { jobId: { in: activeJobIds } },
            _count: { _all: true },
          }),
          prisma.application.groupBy({
            by: ["jobId"],
            where: {
              jobId: { in: activeJobIds },
              status: "APPLIED",
              appliedAt: { lt: staleThreshold },
            },
            _count: { _all: true },
          }),
        ])
      : [[], []];

  const pipelineMap: Record<string, Record<string, number>> = {};
  for (const row of pipelineByJob) {
    if (!pipelineMap[row.jobId]) pipelineMap[row.jobId] = {};
    pipelineMap[row.jobId][row.status] = row._count._all;
  }
  const staleJobIds = new Set(staleAppliedByJob.map((r) => r.jobId));

  const statusMap = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all])
  ) as Record<string, number>;

  const applied = statusMap.APPLIED ?? 0;
  const shortlisted = statusMap.SHORTLISTED ?? 0;
  const interview = statusMap.INTERVIEW ?? 0;
  const hired = statusMap.HIRED ?? 0;
  const reviewedForScore = shortlisted + interview + hired + (statusMap.REJECTED ?? 0);
  const totalApplicants = applied + reviewedForScore;
  const needsReview = applied;

  const viewCountByJob = Object.fromEntries(
    jobViewCounts.map((v) => [v.jobId, v._count._all])
  );

  const profileCompletion = computeProfileCompletion(company);
  const activeJobsWithApplicants = activeJobs.filter((j) => j._count.applications > 0).length;
  const hiringScore = computeHiringScore({
    profileCompletion,
    totalApplicants,
    reviewedCount: reviewedForScore,
    interviewCount: interview,
    hiredCount: hired,
    activeJobsWithApplicants,
    activeJobs: activeJobsCount,
  });

  const scorePercentile = null;

  const appsTodayChange = percentChange(appsToday, appsYesterday, 2);

  const interviewsThisWeek = interview;
  const interviewsChange = percentChange(interviewsThisWeek, interviewsPrevWeek, 3);

  function countByDay(items: { appliedAt?: Date; updatedAt?: Date }[], field: "appliedAt" | "updatedAt", dayList: Date[]) {
    return dayList.map((day) => {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const count = items.filter((item) => {
        const d = item[field];
        return d && d >= day && d < next;
      }).length;
      return { date: formatDayKey(day), count };
    });
  }

  const weeklyTrend = {
    applications: countByDay(appsLastWeek, "appliedAt", days),
    interviews: countByDay(interviewsLastWeek, "updatedAt", days),
  };

  const appsTodaySparkline = countByDay(appsLastWeek, "appliedAt", days).map((d) => d.count);
  const interviewsSparkline = countByDay(interviewsLastWeek, "updatedAt", days).map(
    (d) => d.count
  );

  let actionRequired: string | null = null;
  if (needsReview > 0) {
    actionRequired = `${needsReview} applicant${needsReview === 1 ? "" : "s"} waiting for review`;
  } else if (company.verifiedStatus !== "APPROVED") {
    actionRequired = "Complete company verification to publish jobs publicly";
  } else if (activeJobsCount === 0) {
    actionRequired = "Post your first job to start receiving applications";
  }

  let marketInsight: string | null = null;
  if (newApplicantsThisWeek > 0 && activeJobsCount > 0) {
    const avgPerJob = Math.round(newApplicantsThisWeek / activeJobsCount);
    marketInsight = `${newApplicantsThisWeek} new application${newApplicantsThisWeek === 1 ? "" : "s"} this week across ${activeJobsCount} active job${activeJobsCount === 1 ? "" : "s"} (~${avgPerJob} per job)`;
  } else if (activeJobsCount > 0) {
    marketInsight = "No new applications this week — consider refreshing job descriptions or expanding reach";
  }

  const attentionItems: AttentionItem[] = [];
  if (needsReview > 0) {
    attentionItems.push({
      id: "needs-review",
      label: `${needsReview} applicant${needsReview === 1 ? "" : "s"} need review`,
      href: "/employer/applicants?filter=NEEDS_REVIEW",
      priority: "high",
    });
  }
  if (unreadMessages > 0) {
    attentionItems.push({
      id: "unread-messages",
      label: `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
      href: "/employer/messages",
      priority: "high",
    });
  }

  const noViewJobs = activeJobs.filter(
    (j) =>
      j.status === "ACTIVE" &&
      (viewCountByJob[j.id] ?? 0) === 0 &&
      (j.publishedAt ?? j.createdAt) < sevenDaysAgo
  );
  if (noViewJobs.length > 0) {
    attentionItems.push({
      id: "no-views",
      label: `${noViewJobs.length} job${noViewJobs.length === 1 ? "" : "s"} with no views yet`,
      href: "/employer/jobs",
      priority: "normal",
    });
  }
  // Profile % already shown in hero chip — skip duplicate pill

  const recentActivity: RecentActivityItem[] = recentApplications.map((app) => ({
    id: app.id,
    seekerName: app.seeker.fullName,
    seekerPhotoUrl: app.seeker.photoUrl,
    jobTitle: app.job.title,
    jobId: app.job.id,
    appliedAt: app.appliedAt.toISOString(),
  }));

  return {
    hiringScore,
    scorePercentile,
    funnel: { applied, reviewed: shortlisted, interview, hired },
    metrics: {
      activeJobs: activeJobsCount,
      totalApplicants,
      needsReview,
      appsToday,
      appsTodayChange,
      interviewsActive: interview,
      interviewsChange,
      appsTodaySparkline,
      interviewsSparkline,
    },
    weeklyTrend,
    insights: { actionRequired, marketInsight },
    activeJobs: activeJobs.map((job) => {
      const pipeline = pipelineMap[job.id] ?? {};
      const unreviewedCount = pipeline.APPLIED ?? 0;
      const hiredCount = pipeline.HIRED ?? 0;
      const hasStale = staleJobIds.has(job.id);
      return {
        id: job.id,
        title: job.title,
        status: job.status,
        remoteType: job.remoteType,
        location: job.location,
        applicantCount: job._count.applications,
        viewCount: viewCountByJob[job.id] ?? 0,
        hiredCount,
        targetHireCount: job.targetHireCount,
        needsAttention: job.status === "ACTIVE" && unreviewedCount > 0 && hasStale,
        updatedAt: job.updatedAt.toISOString(),
      };
    }),
    profileCompletion,
    newApplicantsThisWeek,
    companyVerified: company.verifiedStatus === "APPROVED",
    unreadMessages,
    attentionItems,
    recentActivity,
  };
}

export async function getEmployerNavCounts(companyId: string) {
  const [activeJobs, needsReview, unreadMessages] = await Promise.all([
    prisma.job.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.application.count({
      where: { job: { companyId }, status: "APPLIED" },
    }),
    prisma.message.count({
      where: {
        conversation: { companyId },
        readAt: null,
        sender: { role: "SEEKER" },
      },
    }),
  ]);

  return { activeJobs, needsReview, unreadMessages };
}

export async function searchEmployerWorkspace(
  companyId: string,
  query: string
): Promise<
  Array<{ type: "job" | "applicant"; id: string; label: string; sub?: string; href: string }>
> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [jobs, applicants] = await Promise.all([
    prisma.job.findMany({
      where: {
        companyId,
        title: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true, status: true },
    }),
    prisma.application.findMany({
      where: {
        job: { companyId },
        seeker: { fullName: { contains: q, mode: "insensitive" } },
      },
      take: 5,
      select: {
        id: true,
        jobId: true,
        seeker: { select: { fullName: true } },
        job: { select: { title: true } },
      },
    }),
  ]);

  return [
    ...jobs.map((j) => ({
      type: "job" as const,
      id: j.id,
      label: j.title,
      sub: j.status.replace("_", " "),
      href: `/employer/jobs/${j.id}/applicants`,
    })),
    ...applicants.map((a) => ({
      type: "applicant" as const,
      id: a.id,
      label: a.seeker.fullName,
      sub: a.job.title,
      href: `/employer/jobs/${a.jobId}/applicants`,
    })),
  ];
}

export async function recordJobView(jobId: string, sessionHash?: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!job) return;

  const todayStart = dayStart(new Date());
  if (sessionHash) {
    const existing = await prisma.jobView.findFirst({
      where: {
        jobId,
        sessionHash,
        viewedAt: { gte: todayStart },
      },
    });
    if (existing) return;
  }

  await prisma.jobView.create({
    data: { jobId, sessionHash: sessionHash ?? null },
  });
}

export async function getSessionHashFromRequest(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ua = h.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${forwarded ?? "local"}:${ua}`).digest("hex").slice(0, 16);
}
