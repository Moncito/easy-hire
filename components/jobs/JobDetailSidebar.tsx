import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ApplyButton from "@/components/jobs/ApplyButton";
import SaveJobButton from "@/components/jobs/SaveJobButton";

type Company = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  industry: string | null;
  verifiedStatus: string;
};

type ApplyProps = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  screeningQuestions?: {
    id: string;
    prompt: string;
    required: boolean;
  }[];
};

type Props = {
  jobId: string;
  jobTitle: string;
  company: Company;
  isSaved: boolean;
  screeningQuestions?: ApplyProps["screeningQuestions"];
};

export function JobApplyCta({
  jobId,
  jobTitle,
  companyName,
  screeningQuestions = [],
}: ApplyProps) {
  return (
    <div className="border-l-[3px] border-marigold/50 py-1 pl-4">
      <p className="font-display text-base font-bold text-ink">Ready to apply?</p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink/55">
        Your profile and resume go straight to the employer&apos;s board — no agency middlemen.
      </p>
      <div className="mt-4">
        <ApplyButton
          jobId={jobId}
          jobTitle={jobTitle}
          companyName={companyName}
          screeningQuestions={screeningQuestions}
        />
      </div>
    </div>
  );
}

export default function JobDetailSidebar({
  jobId,
  jobTitle,
  company,
  isSaved,
  screeningQuestions = [],
}: Props) {
  const initials = company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      <div className="border-b border-ink/[0.06] pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-ink/8"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy/8 font-display text-sm font-bold text-navy ring-1 ring-ink/8">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display font-bold text-ink">{company.companyName}</p>
              {company.industry && <p className="text-xs text-ink/50">{company.industry}</p>}
            </div>
          </div>
          <SaveJobButton jobId={jobId} saved={isSaved} className="shrink-0" />
        </div>

        <Link
          href={`/companies/${company.id}`}
          className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-ink/55 transition hover:text-teal"
        >
          View full company profile
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="hidden lg:block">
        <JobApplyCta
          jobId={jobId}
          jobTitle={jobTitle}
          companyName={company.companyName}
          screeningQuestions={screeningQuestions}
        />
      </div>
    </aside>
  );
}
