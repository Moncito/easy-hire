import { prisma } from "@/lib/prisma";
import { sendJobAlertEmail } from "@/lib/email";

export type JobAlertDigestFrequency = "DAILY" | "WEEKLY";

/**
 * How many digest emails to send concurrently per batch. Mirrors the
 * pattern in lib/employer/analytics-rollups.ts (ROLLUP_BATCH_SIZE) —
 * bounded concurrency instead of a fully serial loop, so a cron run with
 * many alerts doesn't approach the platform's function timeout.
 */
const DIGEST_BATCH_SIZE = 20;

/** Start of the current digest window for a frequency, anchored to `now`. */
export function digestWindowStart(frequency: JobAlertDigestFrequency, now: Date = new Date()): Date {
  const start = new Date(now);
  start.setDate(start.getDate() - (frequency === "WEEKLY" ? 7 : 1));
  return start;
}

/**
 * Duplicate-send guard. Cron systems retry on timeout/error and this
 * endpoint is also manually triggerable, so an alert already emailed
 * inside the current window must be skipped rather than re-sent.
 */
export function shouldSendJobAlertDigest(lastSentAt: Date | null, windowStart: Date): boolean {
  return !lastSentAt || lastSentAt.getTime() < windowStart.getTime();
}

export type JobAlertDigestSummary = { sent: number; skipped: number; failed: number };

/** Send digest emails for job alerts matching new listings (cron-ready). */
export async function sendJobAlertDigests(
  frequency: JobAlertDigestFrequency = "DAILY"
): Promise<JobAlertDigestSummary> {
  const since = digestWindowStart(frequency);

  const alerts = await prisma.jobAlert.findMany({
    where: {
      frequency,
      // Database-level half of the duplicate-send guard — keeps the
      // fetched set small. shouldSendJobAlertDigest() re-checks each row
      // below so the two never drift apart.
      OR: [{ lastSentAt: null }, { lastSentAt: { lt: since } }],
    },
    include: {
      seeker: { select: { fullName: true, user: { select: { email: true } } } },
    },
  });

  if (alerts.length === 0) return { sent: 0, skipped: 0, failed: 0 };

  const newJobs = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
      publishedAt: { gte: since },
      company: { verifiedStatus: "APPROVED" },
    },
    select: {
      id: true,
      title: true,
      location: true,
      category: true,
      company: { select: { companyName: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  if (newJobs.length === 0) return { sent: 0, skipped: alerts.length, failed: 0 };

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < alerts.length; i += DIGEST_BATCH_SIZE) {
    const batch = alerts.slice(i, i + DIGEST_BATCH_SIZE);
    const outcomes = await Promise.allSettled(
      batch.map(async (alert): Promise<"sent" | "skipped"> => {
        if (!shouldSendJobAlertDigest(alert.lastSentAt, since)) return "skipped";

        const email = alert.seeker.user.email;
        if (!email) return "skipped";

        const keywords = alert.keywords.toLowerCase().split(/\s+/).filter(Boolean);
        const matches = newJobs.filter((job) => {
          if (alert.category && job.category !== alert.category) return false;
          if (keywords.length === 0) return true;
          const haystack = `${job.title} ${job.company.companyName} ${job.location}`.toLowerCase();
          return keywords.some((kw) => haystack.includes(kw));
        });

        if (matches.length === 0) return "skipped";

        const ok = await sendJobAlertEmail({
          to: email,
          seekerName: alert.seeker.fullName,
          frequency,
          jobs: matches.map((j) => ({
            id: j.id,
            title: j.title,
            companyName: j.company.companyName,
            location: j.location,
          })),
        });

        if (!ok) return "skipped";

        await prisma.jobAlert.update({
          where: { id: alert.id },
          data: { lastSentAt: new Date() },
        });
        return "sent";
      })
    );

    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled") {
        if (outcome.value === "sent") sent++;
        else skipped++;
      } else {
        failed++;
        console.error("[job-alerts] digest send failed:", outcome.reason);
      }
    }
  }

  return { sent, skipped, failed };
}
