import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { getEmployerAnalyticsCached } from "@/lib/employer-cache";
import { buildWeeklyChartData, getReportsExclusiveMetrics } from "@/lib/employer/reports-helpers";
import { getJobPerformanceRows } from "@/lib/employer/dashboard-panels";

/**
 * Company-wide reports for any active collaborator. Gated on team:read
 * rather than company:read — OWNER only holds company:manage in the
 * permission matrix, so company:read alone would lock owners out here.
 */
export async function getCollaborativeReportsData(companyId: string, actorUserId: string) {
  const membership = await requireCompanyMembership(companyId, actorUserId, "team:read");
  const analytics = await getEmployerAnalyticsCached(companyId);
  const [exclusive] = await Promise.all([getReportsExclusiveMetrics(companyId, analytics)]);
  return {
    membership,
    analytics,
    chartData: buildWeeklyChartData(analytics),
    exclusive,
    performanceRows: getJobPerformanceRows(analytics.activeJobs),
  };
}
