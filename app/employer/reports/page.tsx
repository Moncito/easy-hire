import { getEmployerAnalyticsCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import {
  areMetricsEmpty,
  getHiringScoreHint,
  isSparseDashboard,
} from "@/lib/employer/dashboard-sparse";
import {
  buildWeeklyChartData,
  isSparseReports,
} from "@/lib/employer/reports-helpers";
import ReportsSparseBoard from "@/components/employer/reports/ReportsSparseBoard";
import ReportsDenseBoard, {
  ReportsPageHeader,
} from "@/components/employer/reports/ReportsDenseBoard";

export default async function EmployerReportsPage() {
  const { company } = await requireEmployerPageContext();
  const analytics = await getEmployerAnalyticsCached(company.id);

  const sparse = isSparseReports(analytics);
  const chartData = buildWeeklyChartData(analytics);
  const metricsEmpty = areMetricsEmpty(analytics);
  const scoreHint = sparse ? getHiringScoreHint(analytics) : null;

  return (
    <>
      <ReportsPageHeader />
      {sparse ? (
        <ReportsSparseBoard analytics={analytics} scoreHint={scoreHint} />
      ) : (
        <ReportsDenseBoard
          analytics={analytics}
          chartData={chartData}
          scoreHint={scoreHint}
          metricsEmpty={metricsEmpty}
          sparse={isSparseDashboard(analytics)}
        />
      )}
    </>
  );
}
