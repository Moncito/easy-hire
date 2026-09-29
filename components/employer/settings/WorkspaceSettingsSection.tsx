import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { WorkspaceSettingsSectionId } from "@/components/account/AccountSettingsNav";
import type { BillingSettingsSummary, TeamSettingsSummary } from "@/lib/employer/workspace-settings";

type CompanyInfo = {
  id: string;
  companyName: string;
  verifiedStatus: "PENDING" | "APPROVED" | "REJECTED";
};

export type WorkspaceSettingsData =
  | { section: "company"; company: CompanyInfo }
  | { section: "team"; collaborativeHiringEnabled: false }
  | { section: "team"; collaborativeHiringEnabled: true; team: TeamSettingsSummary }
  | { section: "billing"; plan: "FREE" | "PRO"; billing: BillingSettingsSummary; periodEndLabel: string | null };

const HEADINGS: Record<WorkspaceSettingsSectionId, { title: string; description: string }> = {
  company: { title: "Company", description: "How your company appears to job seekers, and where verification stands." },
  team: { title: "Team", description: "Who can work in your hiring workspace, and who owns it." },
  billing: { title: "Plan & billing", description: "Your plan and what it's billed at." },
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-ink/[0.06] px-5 py-4 first:border-t-0 sm:px-6">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-right text-sm text-ink">{children}</span>
    </div>
  );
}

function Action({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-teal transition hover:text-teal/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
    >
      {children}
      <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
    </Link>
  );
}

function VerificationValue({ status }: { status: CompanyInfo["verifiedStatus"] }) {
  if (status === "APPROVED") {
    return (
      <Badge tone="teal" size="sm">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
        Verified
      </Badge>
    );
  }
  if (status === "REJECTED") return <span className="font-medium text-ember">Not approved</span>;
  return <span className="text-ink/55">Not verified yet</span>;
}

const SUBSCRIPTION_STATUS_LABELS = { ACTIVE: "Active", CANCELLED: "Cancelled", PAST_DUE: "Payment overdue" } as const;

/**
 * Body of the Workspace group in employer Settings. Summaries only: each
 * section shows state and links to the page that changes it, so there's one
 * place to edit anything. Server component — the page loads only the data
 * for the section being shown.
 */
export default function WorkspaceSettingsSection({ data }: { data: WorkspaceSettingsData }) {
  const heading = HEADINGS[data.section];
  const headingId = `${data.section}-heading`;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-xl font-bold text-ink">
        {heading.title}
      </h2>
      <p className="mt-1 text-sm text-ink/55">{heading.description}</p>

      {data.section === "company" && (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <Row label="Company name">
              {data.company.companyName ? (
                <span className="truncate">{data.company.companyName}</span>
              ) : (
                <span className="text-ink/45">Not set</span>
              )}
            </Row>
            <Row label="Verification">
              <VerificationValue status={data.company.verifiedStatus} />
            </Row>
            {data.company.verifiedStatus === "APPROVED" && (
              <Row label="Public page">
                <Link href={`/companies/${data.company.id}`} className="font-medium text-teal hover:underline">
                  View as a job seeker
                </Link>
              </Row>
            )}
          </div>
          <Action href="/employer/company-profile">
            {data.company.verifiedStatus === "APPROVED" ? "Edit company profile" : "Finish company profile and verification"}
          </Action>
        </>
      )}

      {data.section === "team" && !data.collaborativeHiringEnabled && (
        <>
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-ink/10 bg-white px-5 py-5 sm:px-6">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">Hiring teams come with Employer Pro</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/55">
                Invite recruiters, hiring managers, and viewers into one private workspace, with scorecards
                and shared interview feedback.
              </p>
            </div>
          </div>
          <Action href="/employer/billing">See Employer Pro</Action>
        </>
      )}

      {data.section === "team" && data.collaborativeHiringEnabled && (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <Row label="Teammates">
              <span className="font-data">{data.team.teammates}</span>
            </Row>
            <Row label="Pending invitations">
              <span className="font-data">{data.team.pendingInvitations}</span>
            </Row>
            <Row label="Owner">
              {data.team.pendingOwnerEmail ? (
                <span className="truncate text-ink/70">
                  You · offered to <span className="text-ink">{data.team.pendingOwnerEmail}</span>
                </span>
              ) : (
                <span>You</span>
              )}
            </Row>
          </div>
          <Action href="/employer/team">Manage team and ownership</Action>
        </>
      )}

      {data.section === "billing" && (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <Row label="Plan">
              {data.plan === "PRO" ? (
                <Badge tone="marigold" size="md">
                  Employer Pro
                </Badge>
              ) : (
                <span>Free</span>
              )}
            </Row>
            {data.billing.status && (
              <Row label="Status">
                <span className={data.billing.status === "PAST_DUE" ? "font-medium text-ember" : undefined}>
                  {SUBSCRIPTION_STATUS_LABELS[data.billing.status]}
                </span>
              </Row>
            )}
            {data.periodEndLabel && (
              <Row label={data.billing.status === "CANCELLED" ? "Access ends" : "Renews"}>
                <span className="font-data">{data.periodEndLabel}</span>
              </Row>
            )}
          </div>
          <Action href="/employer/billing">{data.plan === "PRO" ? "Manage billing" : "Compare plans"}</Action>
        </>
      )}
    </section>
  );
}
