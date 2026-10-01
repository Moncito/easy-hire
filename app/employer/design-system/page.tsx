import { notFound } from "next/navigation";
import { Briefcase, Check, Clock, Inbox, MessageSquare, Plus, Share2, Users, X } from "lucide-react";
import { requireEmployerPageContext } from "@/lib/employer-session";
import {
  AnalyticsCard,
  AnalyticsCardSkeleton,
  ApplicationStatusBadge,
  AttentionBanner,
  Avatar,
  Button,
  CandidateReviewCard,
  Card,
  CardHeader,
  EmptyState,
  MetricCard,
  MetricCardSkeleton,
  PageHeader,
  PipelineMini,
  PipelineSummary,
  SectionHeader,
  StatusBadge,
  Table,
  Td,
  Th,
  Tr,
  TrendBarChart,
  TrendIndicator,
} from "@/components/employer/system";
import GalleryInteractive from "@/app/employer/design-system/GalleryInteractive";

/**
 * Development-only gallery of the employer design system — every shared
 * component in one place, for reviewing consistency while pages migrate.
 * Returns 404 in production. The values below are gallery examples, not
 * account data.
 */
export default async function DesignSystemGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await requireEmployerPageContext();

  const days = Array.from({ length: 14 }, (_, i) => ({
    label: `D${i + 1}`,
    tooltipLabel: `Example day ${i + 1}`,
    applications: [0, 1, 0, 2, 3, 0, 1, 0, 0, 4, 2, 1, 0, 2][i],
    interviews: [0, 0, 0, 1, 1, 0, 0, 0, 0, 2, 1, 0, 0, 1][i],
  }));

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Design system"
        meta={<span>Development-only gallery · example values</span>}
        actions={
          <>
            <Button variant="secondary" icon={<Users />}>
              Review applicants
            </Button>
            <Button variant="primary" icon={<Plus />}>
              Post a job
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Buttons" description="Four variants, three sizes (32 / 36 / 40px), plus loading and disabled." />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive" icon={<X />}>
            Reject applicant
          </Button>
          <Button variant="secondary" loading>
            Saving
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Inputs and filters" />
        <GalleryInteractive />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Status" description="Pills with a text label — colour is never the only signal." />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="success">Actively hiring</StatusBadge>
          <StatusBadge tone="warning">Needs attention</StatusBadge>
          <StatusBadge tone="neutral">No applicants</StatusBadge>
          <ApplicationStatusBadge status="APPLIED" />
          <ApplicationStatusBadge status="SHORTLISTED" />
          <ApplicationStatusBadge status="INTERVIEW" />
          <ApplicationStatusBadge status="HIRED" />
          <ApplicationStatusBadge status="REJECTED" />
          <TrendIndicator direction="up">+2 vs prev 30d</TrendIndicator>
          <TrendIndicator direction="down">−1 vs prev 30d</TrendIndicator>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Attention" />
        <AttentionBanner
          title="1 applicant is waiting for your review"
          description="Someone has been waiting for a decision for more than 3 days."
          action={<Button size="sm">Review applicant</Button>}
        />
        <AttentionBanner tone="critical" title="An applicant has waited 38 days" description="Past the 14-day decision target." />
        <AttentionBanner tone="assist" title="Bookkeeper has 3 views and no applicants." action={<Button size="sm">Improve listing</Button>} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Metrics" />
        <div className="grid grid-cols-1 gap-3 min-[521px]:grid-cols-2 min-[861px]:grid-cols-3 min-[1181px]:grid-cols-5">
          <MetricCard label="Active jobs" icon={<Briefcase />} value={6} description={<><b>7</b> openings · <b>1</b> filled</>} />
          <MetricCard label="Applicants" icon={<Users />} value={7} trend={<TrendIndicator direction="up">+5 vs prev 60d</TrendIndicator>} />
          <MetricCard label="Needs review" icon={<Clock />} value={1} tone="attention" description="Oldest waiting 5 days" />
          <MetricCard label="Needs review" icon={<Clock />} value={1} tone="critical" description="Oldest waiting 38 days" />
          <MetricCardSkeleton />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 min-[1181px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AnalyticsCard
          id="gallery-chart"
          title="Applications"
          description="Last 14 days"
          legend={[
            { label: "Applications", tone: "ink" },
            { label: "Moved to interview", tone: "marigold" },
          ]}
          footer={
            <>
              <span>
                Total in range <b className="num">16</b>
              </span>
              <span>
                Busiest day <b>D10</b>
              </span>
            </>
          }
        >
          <TrendBarChart
            data={days}
            labelEvery={2}
            ariaLabel="Example applications per day"
            series={[
              { key: "applications", name: "Applications", tone: "ink" },
              { key: "interviews", name: "Moved to interview", tone: "marigold" },
            ]}
          />
        </AnalyticsCard>
        <Card aria-labelledby="gallery-pipeline">
          <CardHeader id="gallery-pipeline" title="Pipeline" description="All active roles" />
          <PipelineSummary
            className="mt-5"
            showConversion
            note="Each stage counts applications that reached it, so the numbers only go down."
            stages={[
              { label: "Applied", value: 7 },
              { label: "Reviewed", value: 6 },
              { label: "Interview", value: 4, tone: "teal" },
              { label: "Hired", value: 1, tone: "marigold" },
            ]}
          />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 min-[1181px]:grid-cols-2">
        <AnalyticsCard
          id="gallery-empty"
          title="Applications"
          description="Last 7 days"
          empty={{
            icon: <Inbox />,
            title: "No application activity yet",
            description: "Share your listing to start building your pipeline.",
            action: (
              <Button size="sm" icon={<Share2 />}>
                Share listing
              </Button>
            ),
          }}
        >
          {null}
        </AnalyticsCard>
        <AnalyticsCardSkeleton height={160} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Candidates" />
        <Card>
          <CandidateReviewCard
            name="Example Candidate"
            role="Bookkeeper"
            appliedLabel="Aug 23"
            waitingDays={38}
            actions={
              <>
                <Button variant="ghost" size="sm" icon={<X />}>
                  Reject
                </Button>
                <Button size="sm">View profile</Button>
                <Button size="sm" icon={<Check />}>
                  Shortlist
                </Button>
              </>
            }
          />
          <div className="mt-3 divide-y divide-eh-line">
            <CandidateReviewCard variant="row" name="Second Example" role="Executive Assistant" waitingDays={5} status={<ApplicationStatusBadge status="APPLIED" />} actions={<Button variant="ghost" size="sm">Review</Button>} />
            <CandidateReviewCard variant="row" name="Third Example" role="Customer Support" waitingDays={1} status={<ApplicationStatusBadge status="INTERVIEW" />} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Avatar name="Extra Small" size="xs" />
            <Avatar name="Small Size" size="sm" />
            <Avatar name="Medium Size" size="md" />
            <Avatar name="Large Size" size="lg" />
            <Avatar name="Company Logo" size="lg" shape="square" />
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Table" />
        <Card padded={false}>
          <div className="px-5 py-4 sm:px-6">
            <CardHeader title="Active roles" description="3 listings" />
          </div>
          <Table minWidth={720} caption="Example roles">
            <thead>
              <tr>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th align="right">Applicants</Th>
                <Th>Pipeline</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {[
                { t: "Bookkeeper", s: <StatusBadge tone="warning">1 needs review</StatusBadge>, a: 4, p: [1, 1, 2, 0] },
                { t: "Executive Assistant", s: null, a: 6, p: [0, 3, 2, 1] },
                { t: "Customer Support", s: <StatusBadge tone="neutral">No applicants</StatusBadge>, a: 0, p: [0, 0, 0, 0] },
              ].map((row) => (
                <Tr key={row.t}>
                  <Td>
                    <p className="font-semibold text-eh-ink">{row.t}</p>
                    <p className="text-small text-eh-muted">Philippines · Remote</p>
                  </Td>
                  <Td>{row.s}</Td>
                  <Td numeric>{row.a}</Td>
                  <Td>
                    <PipelineMini
                      stages={[
                        { label: "Applied", value: row.p[0], tone: "muted" },
                        { label: "Shortlisted", value: row.p[1], tone: "ink" },
                        { label: "Interview", value: row.p[2], tone: "teal" },
                        { label: "Hired", value: row.p[3], tone: "marigold" },
                      ]}
                    />
                  </Td>
                  <Td align="right">
                    <Button size="sm" variant={row.s && row.a > 0 ? "primary" : "secondary"} icon={row.a === 0 ? <Share2 /> : <MessageSquare />}>
                      {row.a === 0 ? "Share listing" : "View applicants"}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Empty state" />
        <Card>
          <EmptyState
            icon={<Users />}
            title="No applicants yet"
            description="Your listing is live, but nobody has applied yet."
            action={<Button icon={<Share2 />}>Share listing</Button>}
          />
        </Card>
      </section>
    </div>
  );
}
