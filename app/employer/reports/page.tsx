import { getEmployerAnalyticsCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { getHiringScoreHint } from "@/lib/employer/dashboard-sparse";
import {
  buildWeeklyChartData,
  getReportsExclusiveMetrics,
  isSparseReports,
} from "@/lib/employer/reports-helpers";
import ReportsSparseBoard from "@/components/employer/reports/ReportsSparseBoard";
import { ReportsPageHeader } from "@/components/employer/reports/ReportsDenseBoard";
import ReportsDenseUpgradeBoard from "@/components/employer/reports/ReportsDenseUpgradeBoard";
import ProReportsBoard from "@/components/employer/pro-dashboard/ProReportsBoard";

export default async function EmployerReportsPage() {
  const { company, plan } = await requireEmployerPageContext();
  const isPro = plan === "PRO";
  const analytics = await getEmployerAnalyticsCached(company.id);

  const sparse = isSparseReports(analytics);
  const chartData = buildWeeklyChartData(analytics);
  const scoreHint = sparse ? getHiringScoreHint(analytics) : null;

  if (isPro) {
    const exclusive = await getReportsExclusiveMetrics(company.id, analytics);
    return (
      <ProReportsBoard
        analytics={analytics}
        chartData={chartData}
        exclusive={exclusive}
        sparse={sparse}
      />
    );
  }

  return (
    <>
      <ReportsPageHeader />
      {sparse ? (
        <ReportsSparseBoard analytics={analytics} scoreHint={scoreHint} />
      ) : (
        <ReportsDenseUpgradeBoard analytics={analytics} />
      )}
    </>
  );
}
