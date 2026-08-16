import Link from "next/link";
import { ExternalLink, Briefcase, Users, Check, MapPin } from "lucide-react";
import ProButton from "@/components/employer/pro/ProButton";

type ChecklistItem = { label: string; done: boolean };

type Props = {
  logoInitials: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  companyName: string;
  industry: string;
  description: string;
  highlights: string[];
  headquarters: string;
  teamSize: string;
  website: string;
  activeJobsCount: number;
  totalApplicantsCount: number;
  verified: boolean;
  companyId: string;
  profileStrength: number;
  strengthLabel: string;
  checklist: ChecklistItem[];
};

export default function ProCompanyWorkspace({
  logoInitials,
  logoUrl,
  bannerUrl,
  companyName,
  industry,
  description,
  highlights,
  headquarters,
  teamSize,
  website,
  activeJobsCount,
  totalApplicantsCount,
  verified,
  companyId,
  profileStrength,
  strengthLabel,
  checklist,
}: Props) {
  const displayDescription =
    description ||
    "Add your company description so candidates understand your culture and mission.";
  const remaining = checklist.filter((item) => !item.done);

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
      <article className="pro-card overflow-hidden">
        <p className="border-b border-ink/6 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink/40">
          What VAs see
        </p>
        <div className="h-24 overflow-hidden sm:h-28">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-r from-ink/10 via-marigold/20 to-ink/10" />
          )}
        </div>
        <div className="relative px-4 pb-4">
          <div className="-mt-7 mb-2 flex items-end gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-14 w-14 rounded-xl border-[3px] border-white bg-ink object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-white bg-marigold font-display text-lg font-bold text-ink shadow-sm">
                {logoInitials}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-display text-sm font-bold text-ink">
                  {companyName || "Your Company"}
                </p>
                {verified && (
                  <span className="rounded-full bg-teal/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-ink/50">{industry || "Industry not set"}</p>
            </div>
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-ink/60">{displayDescription}</p>
          {highlights.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {highlights.slice(0, 4).map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink/65"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      <article className="pro-card flex flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Profile strength</p>
            <p className="mt-0.5 font-data text-3xl font-bold tabular-nums text-ink">{profileStrength}%</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
              profileStrength >= 75 ? "bg-teal/10 text-teal" : "bg-marigold/15 text-[#9A5B12]"
            }`}
          >
            {strengthLabel}
          </span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full bg-marigold transition-all duration-500"
            style={{ width: `${profileStrength}%` }}
          />
        </div>
        <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5 text-xs">
              {item.done ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-teal" strokeWidth={3} aria-hidden="true" />
              ) : (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink/20" aria-hidden="true" />
              )}
              <span className={item.done ? "text-ink/45" : "text-ink/75"}>{item.label}</span>
            </li>
          ))}
        </ul>
        {remaining.length > 0 && (
          <p className="mt-auto pt-3 text-xs text-ink/45">
            {remaining.length} still open — logo and About move the needle most.
          </p>
        )}
      </article>

      <article className="pro-card flex flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Company pulse</p>
        <dl className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-sm text-ink/50">
              <Briefcase className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
              Active jobs
            </dt>
            <dd className="font-data text-sm font-bold tabular-nums text-ink">{activeJobsCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-sm text-ink/50">
              <Users className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
              Applicants
            </dt>
            <dd className="font-data text-sm font-bold tabular-nums text-ink">{totalApplicantsCount}</dd>
          </div>
          {teamSize && (
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-sm text-ink/50">
                <Users className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
                Team size
              </dt>
              <dd className="font-data text-sm font-semibold text-ink">{teamSize}</dd>
            </div>
          )}
        </dl>
        {(headquarters || website) && (
          <div className="mt-4 border-t border-ink/6 pt-3 text-xs text-ink/45">
            {headquarters && (
              <p className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {headquarters}
              </p>
            )}
            {website && <p className="mt-1 truncate">{website.replace(/^https?:\/\/(www\.)?/, "")}</p>}
          </div>
        )}
        <div className="mt-auto pt-4">
          <ProButton
            href={`/companies/${companyId}`}
            variant="secondary"
            fullWidth
            icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
          >
            View public page
          </ProButton>
          {activeJobsCount === 0 && (
            <p className="mt-2 text-center text-xs text-ink/45">
              No live roles —{" "}
              <Link href="/employer/jobs/new" className="font-semibold text-[#9A5B12] hover:underline">
                post a job
              </Link>
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
