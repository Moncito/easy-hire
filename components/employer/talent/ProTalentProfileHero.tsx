import type { ReactNode } from "react";
import { Banknote, Briefcase, Calendar, Download, Globe, Gauge, MapPin } from "lucide-react";
import { Avatar, Button } from "@/components/employer/system";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";
import { TONE_CHIP, type SectionTone } from "@/components/employer/talent/tones";
import { profileBucketCompletion } from "@/components/seeker/profile-buckets";
import type { EmployerPreviewData } from "@/components/seeker/SeekerEmployerPreview";
import { formatSalaryRange } from "@/lib/format";
import { timezoneLabel } from "@/lib/seeker/profile-format";

function Stat({ icon, tone, label, children }: { icon: ReactNode; tone: SectionTone; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-5 py-4 sm:px-6">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-control [&_svg]:h-5 [&_svg]:w-5 ${TONE_CHIP[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <dl className="flex min-w-0 flex-col-reverse">
        <dt className="text-small text-eh-muted">{label}</dt>
        <dd className="font-heading text-[17px] font-semibold leading-snug text-eh-ink">{children}</dd>
      </dl>
    </div>
  );
}

/**
 * Employer Pro talent profile hero: a Harbor Navy cover band with the
 * photo overlapping it, who they are and where, the actions, and a strip
 * of the four facts an employer checks first — pay, availability,
 * experience and how complete the profile is — each on a tinted chip.
 */
export default function ProTalentProfileHero({
  data,
  seekerId,
  saved,
  canDownloadResume,
}: {
  data: EmployerPreviewData;
  seekerId: string;
  saved: boolean;
  canDownloadResume: boolean;
}) {
  const salary = formatSalaryRange(data.desiredSalaryMin, data.desiredSalaryMax);
  const { completed, total } = profileBucketCompletion(data);
  const strength = Math.round((completed / total) * 100);

  return (
    <section
      aria-label={`${data.fullName}, talent profile`}
      className="overflow-hidden rounded-card border border-eh-line bg-eh-surface shadow-eh-md"
    >
      <div className="h-24 bg-eh-navy sm:h-28" aria-hidden="true" />

      <div className="px-5 pb-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar
            name={data.fullName}
            src={data.photoUrl}
            size="lg"
            className="-mt-12 h-24! w-24! border-4 border-eh-surface text-2xl! shadow-eh-md sm:-mt-14"
          />
          <div className="min-w-0 flex-1 sm:pb-1">
            <h1 className="font-heading text-[30px] font-bold leading-tight tracking-[-0.02em] text-eh-ink">
              {data.fullName}
            </h1>
            <p className="mt-0.5 text-body text-eh-ink-2">{data.headline || "Virtual Assistant"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:pb-1">
            <MessageSeekerButton seekerId={seekerId} />
            <SaveSeekerButton seekerId={seekerId} saved={saved} />
            {canDownloadResume && data.resumeUrl && (
              <Button size="sm" href={`/api/employer/talent/${seekerId}/resume`} native icon={<Download />}>
                Resume
              </Button>
            )}
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2 text-small" aria-label="Details">
          {data.location && (
            <li className="inline-flex items-center gap-1.5 rounded-full border border-eh-line bg-eh-surface-2 px-2.5 py-1 text-eh-ink-2">
              <MapPin className="h-3.5 w-3.5 text-eh-muted" aria-hidden="true" />
              {data.location}
            </li>
          )}
          {data.timezone && (
            <li className="inline-flex items-center gap-1.5 rounded-full border border-eh-line bg-eh-surface-2 px-2.5 py-1 text-eh-ink-2">
              <Globe className="h-3.5 w-3.5 text-eh-muted" aria-hidden="true" />
              {timezoneLabel(data.timezone)}
            </li>
          )}
          {data.availability && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-eh-teal-tint px-2.5 py-1 font-medium text-eh-teal-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-eh-teal" aria-hidden="true" />
              Open to {data.availability.toLowerCase()} work
            </li>
          )}
        </ul>
      </div>

      <div className="grid grid-cols-1 divide-y divide-eh-line border-t border-eh-line bg-eh-surface-2/60 sm:grid-cols-2 sm:divide-x xl:grid-cols-4 xl:divide-y-0 [&>*:nth-child(2)]:sm:border-t-0">
        <Stat icon={<Banknote />} tone="marigold" label="Expected pay">
          <span className="font-data text-[14px]">{salary}</span>
        </Stat>
        <Stat icon={<Briefcase />} tone="teal" label="Availability">
          {data.availability || "—"}
        </Stat>
        <Stat icon={<Calendar />} tone="navy" label="Experience">
          {data.yearsExperience || "—"}
        </Stat>
        <Stat icon={<Gauge />} tone="marigold" label="Profile strength">
          <span className="num">{strength}%</span>
          <span className="num ml-1.5 text-small font-normal text-eh-muted">
            {completed}/{total}
          </span>
        </Stat>
      </div>
    </section>
  );
}
