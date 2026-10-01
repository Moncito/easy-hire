import { Card, CardHeader, PipelineSummary } from "@/components/employer/system";
import type { PipelineFunnel } from "@/lib/employer/dashboard-pipeline";

/**
 * Applied → Reviewed → Interviewed → Hired over active roles. Each stage
 * counts applications that reached it or went further (buildPipelineFunnel),
 * so the bars only get shorter. Bars are sized against Applied.
 */
export default function ProPipelineFunnel({ funnel }: { funnel: PipelineFunnel }) {
  const legacy = funnel.rejectedWithoutHistory;
  const note =
    "Each stage counts applications that reached it, so the numbers only go down." +
    (legacy > 0
      ? ` ${legacy} rejected ${legacy === 1 ? "application predates" : "applications predate"} stage tracking, so ${
          legacy === 1 ? "it counts" : "they count"
        } only as reviewed.`
      : "");

  return (
    <Card aria-labelledby="pro-pipeline-heading">
      <CardHeader id="pro-pipeline-heading" title="Pipeline" description="All active roles" />
      <PipelineSummary
        className="mt-5"
        showConversion
        note={note}
        stages={[
          { label: "Applied", value: funnel.applied },
          { label: "Reviewed", value: funnel.reviewed },
          { label: "Interviewed", value: funnel.interviewed, tone: "teal" },
          { label: "Hired", value: funnel.hired, tone: "marigold" },
        ]}
      />
    </Card>
  );
}
