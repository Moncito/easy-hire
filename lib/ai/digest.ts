import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { renderEmailLayout } from "@/lib/shared/email-layout";
import { escapeHtml } from "@/lib/escape-html";
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
    renderEmailLayout({
      preview: `Your weekly hiring digest for ${company.companyName}.`,
      heading: "This week in hiring",
      bodyHtml: `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(company.companyName)} team,</p>
        ${narrativeHtml}
      `,
      cta: {
        label: "Open your dashboard",
        href: `${appUrl}/employer/dashboard`,
      },
    })
  );

  return true;
}

/**
 * How many companies to process concurrently in the weekly cron. Each
 * company does a full analytics + AI provider round trip, so this stays
 * well below lib/employer/analytics-rollups.ts's ROLLUP_BATCH_SIZE to
 * avoid hitting the platform's function timeout or the AI provider's own
 * rate limits.
 */
const AI_DIGEST_BATCH_SIZE = 5;

/** Sends the weekly digest to every currently active Pro company. Intended for a scheduled cron job. */
export async function sendWeeklyDigestToAllProCompanies(): Promise<{ sent: number; failed: number }> {
  const proCompanies = await prisma.subscription.findMany({
    where: { status: "ACTIVE", planType: "PRO" },
    select: { companyId: true },
    distinct: ["companyId"],
  });

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < proCompanies.length; i += AI_DIGEST_BATCH_SIZE) {
    const batch = proCompanies.slice(i, i + AI_DIGEST_BATCH_SIZE);
    const outcomes = await Promise.allSettled(
      batch.map(({ companyId }) => sendWeeklyDigestForCompany(companyId))
    );

    outcomes.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") {
        if (outcome.value) sent += 1;
      } else {
        failed += 1;
        console.error(`[ai-digest] failed for company ${batch[index].companyId}:`, outcome.reason);
      }
    });
  }

  return { sent, failed };
}
