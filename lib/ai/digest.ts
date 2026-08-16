import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isEmployerPro } from "@/lib/billing/subscriptions";
import { generateHiringInsights } from "@/lib/ai/features/insights";
import { getEmployerAnalytics } from "@/lib/employer-analytics";

const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

/**
 * Sends one Pro company its weekly Easy AI hiring digest. No-ops quietly
 * when Resend isn't configured (handled inside `sendEmail`) or when Easy AI
 * has no provider key (falls back to a numbers-only digest instead of the
 * AI narrative).
 */
export async function sendWeeklyDigestForCompany(companyId: string): Promise<boolean> {
  const pro = await isEmployerPro(companyId);
  if (!pro) return false;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { user: { select: { email: true } } },
  });
  if (!company) return false;

  const analytics = await getEmployerAnalytics(companyId);
  const insights = await generateHiringInsights(companyId).catch((error) => {
    console.error("[ai-digest] insights generation failed:", error);
    return { configured: false, data: null } as const;
  });

  const narrativeHtml = insights.data
    ? `<p>${insights.data.narrative}</p><ul>${insights.data.highlights
        .map((h) => `<li>${h}</li>`)
        .join("")}</ul>`
    : `<p>This week: ${analytics.newApplicantsThisWeek} new applicant${
        analytics.newApplicantsThisWeek === 1 ? "" : "s"
      } across ${analytics.metrics.activeJobs} active job${analytics.metrics.activeJobs === 1 ? "" : "s"}.</p>`;

  await sendEmail(
    company.user.email,
    `Your weekly hiring digest — ${company.companyName}`,
    `<p>Hi ${company.companyName} team,</p>
     ${narrativeHtml}
     <p><a href="${appUrl}/employer/dashboard">Open your dashboard</a></p>`
  );

  return true;
}

/** Sends the weekly digest to every currently active Pro company. Intended for a scheduled cron job. */
export async function sendWeeklyDigestToAllProCompanies(): Promise<{ sent: number; failed: number }> {
  const proCompanies = await prisma.subscription.findMany({
    where: { status: "ACTIVE", planType: "PRO" },
    select: { companyId: true },
    distinct: ["companyId"],
  });

  let sent = 0;
  let failed = 0;

  for (const { companyId } of proCompanies) {
    try {
      const ok = await sendWeeklyDigestForCompany(companyId);
      if (ok) sent += 1;
    } catch (error) {
      failed += 1;
      console.error(`[ai-digest] failed for company ${companyId}:`, error);
    }
  }

  return { sent, failed };
}
