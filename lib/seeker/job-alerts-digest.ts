import { prisma } from "@/lib/prisma";
import { sendJobAlertEmail } from "@/lib/email";

/** Send digest emails for job alerts matching new listings (cron-ready). */
export async function sendJobAlertDigests(frequency: "DAILY" | "WEEKLY" = "DAILY") {
  const since = new Date();
  since.setDate(since.getDate() - (frequency === "WEEKLY" ? 7 : 1));

  const alerts = await prisma.jobAlert.findMany({
    where: { frequency },
    include: {
      seeker: {
        select: { fullName: true, user: { select: { email: true } } },
      },
    },
  });

  if (alerts.length === 0) return { sent: 0 };

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

  if (newJobs.length === 0) return { sent: 0 };

  let sent = 0;
  for (const alert of alerts) {
    const email = alert.seeker.user.email;
    if (!email) continue;

    const keywords = alert.keywords.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = newJobs.filter((job) => {
      if (alert.category && job.category !== alert.category) return false;
      if (keywords.length === 0) return true;
      const haystack = `${job.title} ${job.company.companyName} ${job.location}`.toLowerCase();
      return keywords.some((kw) => haystack.includes(kw));
    });

    if (matches.length === 0) continue;

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

    if (ok) sent++;
  }

  return { sent };
}
