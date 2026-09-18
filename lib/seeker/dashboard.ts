import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import { listJobAlerts } from "@/lib/job-alerts";
import {
  seekerApplicationsTag,
  seekerInterviewsTag,
  seekerJobAlertsTag,
  seekerProfileTag,
  seekerSavedJobsTag,
} from "@/lib/seeker/cache-tags";
import { reviveDates } from "@/lib/cache-utils";

export const APPLICATION_STATUS_PIPELINE = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"] as const;
export type ApplicationStatusFilter = (typeof APPLICATION_STATUS_PIPELINE)[number] | "ALL";
export const APPLICATION_STATUS_FILTERS: ApplicationStatusFilter[] = ["ALL", ...APPLICATION_STATUS_PIPELINE];

/** Parses the dashboard's `?status=` query param, falling back to "ALL" for anything unrecognized. */
export function normalizeApplicationStatusFilter(raw: string | undefined): ApplicationStatusFilter {
  const normalized = raw?.toUpperCase() as ApplicationStatusFilter | undefined;
  return normalized && APPLICATION_STATUS_FILTERS.includes(normalized) ? normalized : "ALL";
}

/** Tailwind classes for an application-status pill, shared by the dashboard's featured card and pipeline list. */
export function applicationStatusBadgeClassName(status: string): string {
  if (status === "REJECTED") return "bg-ember/10 text-ember border border-ember/20";
  if (status === "HIRED") return "bg-marigold/15 text-[#7a4a0a] border border-marigold/20";
  if (status === "INTERVIEW") return "bg-marigold/10 text-[#8a5a10] border border-marigold/15";
  if (status === "SHORTLISTED") return "bg-navy/8 text-navy border border-navy/15";
  return "bg-ink/5 text-ink/55 border border-ink/8";
}

/** The dashboard's "featured" application: most recent non-rejected one, or null if every application was rejected (or there are none). */
export function pickFeaturedApplication<T extends { status: string }>(apps: T[]): T | null {
  return apps.find((a) => a.status !== "REJECTED") ?? null;
}

/** The pipeline list below the featured card: respects the status filter, and excludes the featured application when showing "ALL" so it isn't listed twice. */
export function filterPipelineApplications<T extends { id: string; status: string }>(
  apps: T[],
  statusFilter: ApplicationStatusFilter,
  featuredId: string | null
): T[] {
  if (statusFilter === "ALL") {
    return apps.filter((a) => (featuredId ? a.id !== featuredId : true));
  }
  return apps.filter((a) => a.status === statusFilter);
}

const DASHBOARD_REVALIDATE_SECONDS = 20;
const INTERVIEWS_REVALIDATE_SECONDS = 20;
// Upcoming + recent past — a seeker's interview history is not unbounded the
// way an employer's calendar can be, but this still caps the query per the
// repo-wide findMany bound convention (see lib/seeker/saved-jobs.ts, take: 5).
const INTERVIEWS_TAKE = 25;

export async function getSeekerDashboardProfile(userId: string, fullName: string) {
  // Ensures the profile row exists before the cached read below — cheap now
  // that ensureSeekerProfile's own lookup is cached (see lib/seeker/seekers.ts).
  await ensureSeekerProfile(userId, { fullName });

  const result = await unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({
        where: { userId },
        include: {
          applications: {
            orderBy: { appliedAt: "desc" },
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: { select: { companyName: true } },
                },
              },
            },
          },
          savedJobs: {
            orderBy: { savedAt: "desc" },
            take: 5,
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: { select: { companyName: true } },
                },
              },
            },
          },
          conversations: {
            orderBy: { lastMessageAt: "desc" },
            take: 3,
            include: {
              company: { select: { companyName: true } },
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      const jobAlerts = await listJobAlerts(userId);

      return { profile, jobAlerts };
    },
    ["seeker-dashboard", userId],
    {
      revalidate: DASHBOARD_REVALIDATE_SECONDS,
      tags: [
        seekerProfileTag(userId),
        seekerApplicationsTag(userId),
        seekerSavedJobsTag(userId),
        seekerJobAlertsTag(userId),
      ],
    }
  )();
  return reviveDates(result);
}

export type SeekerInterview = {
  id: string;
  scheduledAt: Date;
  durationMins: number;
  format: string;
  location: string | null;
  status: string;
  seekerResponseStatus: string | null;
  seekerRespondedAt: Date | null;
  jobId: string;
  jobTitle: string;
  companyName: string;
};

/**
 * A seeker's own interviews — scoped strictly to applications they own via
 * seekerProfile.id (same ownership-by-profile-id guard as
 * lib/seeker/saved-jobs.ts / lib/seeker/job-alerts.ts, not a hand-rolled
 * check). Only candidate-facing fields are selected: this deliberately never
 * touches InterviewParticipant.notes, InterviewParticipant.outcome,
 * Interview.outcome, or CandidateEvaluation — those are the employer's
 * private hiring notes and must never reach a seeker-facing response.
 */
export async function getSeekerInterviews(userId: string): Promise<SeekerInterview[]> {
  const result = await unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!profile) return [];

      const interviews = await prisma.interview.findMany({
        where: { application: { seekerId: profile.id } },
        orderBy: { scheduledAt: "desc" },
        take: INTERVIEWS_TAKE,
        select: {
          id: true,
          scheduledAt: true,
          durationMins: true,
          format: true,
          location: true,
          status: true,
          seekerResponseStatus: true,
          seekerRespondedAt: true,
          application: {
            select: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: { select: { companyName: true } },
                },
              },
            },
          },
        },
      });

      return interviews.map((interview) => ({
        id: interview.id,
        scheduledAt: interview.scheduledAt,
        durationMins: interview.durationMins,
        format: interview.format,
        location: interview.location,
        status: interview.status,
        seekerResponseStatus: interview.seekerResponseStatus,
        seekerRespondedAt: interview.seekerRespondedAt,
        jobId: interview.application.job.id,
        jobTitle: interview.application.job.title,
        companyName: interview.application.job.company.companyName,
      }));
    },
    ["seeker-interviews", userId],
    {
      revalidate: INTERVIEWS_REVALIDATE_SECONDS,
      tags: [seekerInterviewsTag(userId)],
    }
  )();
  return reviveDates(result);
}
