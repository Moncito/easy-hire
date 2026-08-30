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
