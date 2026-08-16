import { z } from "zod";
import { getEmployerAnalytics } from "@/lib/employer-analytics";
import { generateAiObject } from "@/lib/ai/run";

export const insightsInputSchema = z.object({});
export type InsightsInput = z.infer<typeof insightsInputSchema>;

const insightsOutputSchema = z.object({
  narrative: z.string().describe("2-3 sentence plain-language summary of current hiring health"),
  highlights: z.array(z.string()).min(1).max(4).describe("Short bullet callouts, most important first"),
});
export type InsightsOutput = z.infer<typeof insightsOutputSchema>;

/** Natural-language funnel narrative for the Dashboard / Reports pages. */
export async function generateHiringInsights(companyId: string) {
  const analytics = await getEmployerAnalytics(companyId);

  const prompt = `
Active jobs: ${analytics.metrics.activeJobs}
Total applicants: ${analytics.metrics.totalApplicants}
Applicants needing review: ${analytics.metrics.needsReview}
Applications today: ${analytics.metrics.appsToday} (change vs yesterday: ${analytics.metrics.appsTodayChange ?? "n/a"}%)
Active interviews: ${analytics.metrics.interviewsActive} (change vs last week: ${analytics.metrics.interviewsChange ?? "n/a"}%)
Funnel — applied: ${analytics.funnel.applied}, reviewed: ${analytics.funnel.reviewed}, interview: ${analytics.funnel.interview}, hired: ${analytics.funnel.hired}
New applicants this week: ${analytics.newApplicantsThisWeek}
Unread messages: ${analytics.unreadMessages}
Company verified: ${analytics.companyVerified}
`.trim();

  return generateAiObject({
    companyId,
    feature: "insights",
    schema: insightsOutputSchema,
    system:
      "You summarize hiring funnel data for a busy employer in plain, encouraging language. Be specific with numbers already given — never invent data. Suggest one concrete next action when relevant.",
    prompt,
  });
}
