import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, MessageSquare } from "lucide-react";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-ink/8 text-ink/70",
  SHORTLISTED: "bg-navy/10 text-navy",
  INTERVIEW: "bg-teal/10 text-teal",
  HIRED: "bg-teal text-white",
  REJECTED: "bg-ink/10 text-ink/50",
};

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

type Application = {
  id: string;
  status: string;
  appliedAt: string;
  job: { id: string; title: string };
};

type Props = {
  applications: Application[];
  seekerName: string;
  seekerPhotoUrl: string | null;
  seekerId: string;
};

function NextStepHint({ application, seekerId }: { application: Application; seekerId: string }) {
  if (application.status === "HIRED") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-teal/8 px-3 py-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
        <p className="flex-1 text-xs text-ink/65">
          This candidate was hired for this role.
        </p>
        <Link
          href={`/employer/jobs/${application.job.id}/applicants`}
          className="text-xs font-semibold text-teal hover:underline"
        >
          View in pipeline
        </Link>
        <MessageSeekerButton seekerId={seekerId} jobId={application.job.id} />
      </div>
    );
  }

  if (application.status === "APPLIED") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-teal/20 bg-teal/[0.03] px-3 py-2.5">
        <p className="flex-1 text-xs text-ink/55">New application — review in your pipeline.</p>
        <Link
          href={`/employer/jobs/${application.job.id}/applicants`}
          className="inline-flex items-center gap-1 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/95"
        >
          Review now
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  if (application.status === "INTERVIEW" || application.status === "SHORTLISTED") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-navy/[0.03] px-3 py-2.5">
        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-navy/50" aria-hidden="true" />
        <p className="flex-1 text-xs text-ink/55">
          {application.status === "INTERVIEW"
            ? "Interview stage — coordinate next steps."
            : "Shortlisted — keep the conversation going."}
        </p>
        <MessageSeekerButton seekerId={seekerId} jobId={application.job.id} />
      </div>
    );
  }

  return null;
}

export default function TalentApplicationHistory({
  applications,
  seekerName,
  seekerPhotoUrl,
  seekerId,
}: Props) {
  const latestApplication = applications[0];

  return (
    <DashboardSurface>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Your company</p>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            Application history
          </h2>
        </div>
        {applications.length > 0 && (
          <Link
            href="/employer/applicants"
            className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
          >
            View pipeline
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/10 bg-ink/[0.02] px-4 py-8 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-ink/20" strokeWidth={1.5} />
          <p className="mt-2 text-sm font-medium text-ink/55">
            Hasn&apos;t applied to your jobs yet
          </p>
          <p className="mt-1 text-xs text-ink/40">
            Message them about an open role or invite them to apply.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <MessageSeekerButton seekerId={seekerId} />
            <Link
              href="/employer/jobs"
              className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/65 hover:bg-ink/3"
            >
              View active jobs
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ink/[0.06]">
            {applications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/employer/jobs/${application.job.id}/applicants`}
                  className="group flex items-center gap-3 py-3 transition first:pt-0 hover:bg-ink/[0.02]"
                >
                  <EmployerAvatar name={seekerName} imageUrl={seekerPhotoUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-teal">
                      {application.job.title}
                    </p>
                    <p className="text-xs text-ink/45">
                      Applied{" "}
                      {new Date(application.appliedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      STATUS_STYLES[application.status] ?? STATUS_STYLES.APPLIED
                    }`}
                  >
                    {STATUS_LABEL[application.status] ?? application.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {latestApplication && (
            <NextStepHint application={latestApplication} seekerId={seekerId} />
          )}
        </>
      )}
    </DashboardSurface>
  );
}
