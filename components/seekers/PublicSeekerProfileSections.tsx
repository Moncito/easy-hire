import {
  MapPin,
  Globe,
  Wallet,
  Clock,
  Briefcase,
  GraduationCap,
  Languages,
  Award,
  Link2,
  ExternalLink,
  FileText,
} from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import {
  displayCertification,
  displayEducation,
  displayLanguage,
  displaySkill,
  formatRelativeUpdated,
  parseEducation,
  parseWorkExperience,
  timezoneLabel,
} from "@/lib/seeker-profile-format";

export type PublicSeekerData = {
  fullName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  yearsExperience: string | null;
  availability: string | null;
  skills: string[];
  workExperience: string[];
  education: string[];
  languages: string[];
  certifications: string[];
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  updatedAt: Date;
};

type Fact = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
};

function FactCell({ icon: Icon, label, value, hint, mono }: Fact) {
  return (
    <div className="min-w-0 px-4 py-4 first:pl-0 last:pr-0">
      <div className="mb-1.5 flex items-center gap-1.5 text-ink/40">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className={`text-sm font-semibold text-ink ${mono ? "font-data" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-ink/45">{hint}</p>}
    </div>
  );
}

function buildFacts(seeker: PublicSeekerData): Fact[] {
  const facts: Fact[] = [];

  if (seeker.location) {
    facts.push({
      icon: MapPin,
      label: "Location",
      value: seeker.location,
      hint: "Based in the Philippines or remote-ready",
    });
  }

  if (seeker.timezone) {
    facts.push({
      icon: Globe,
      label: "Timezone",
      value: timezoneLabel(seeker.timezone),
      hint: "Overlap with employer hours",
    });
  }

  if (seeker.desiredSalaryMin || seeker.desiredSalaryMax) {
    facts.push({
      icon: Wallet,
      label: "Expected pay",
      value: formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax),
      hint: "Monthly USD range on profile",
      mono: true,
    });
  }

  if (seeker.yearsExperience) {
    facts.push({
      icon: Briefcase,
      label: "Experience",
      value: seeker.yearsExperience,
      hint: "Professional VA experience",
    });
  }

  if (seeker.availability) {
    facts.push({
      icon: Clock,
      label: "Availability",
      value: seeker.availability,
      hint: "Ready to start",
    });
  }

  if (seeker.skills.length > 0) {
    facts.push({
      icon: Award,
      label: "Core skills",
      value: `${seeker.skills.length} listed`,
      hint: "See specializations below",
    });
  }

  return facts;
}

function buildAboutParagraph(seeker: PublicSeekerData): string {
  const trimmed = seeker.bio?.trim();
  if (trimmed && trimmed.length >= 50) return trimmed;

  const parts: string[] = [];
  parts.push(
    `${seeker.fullName} is a ${seeker.headline || "virtual assistant"} on EasyHire`
  );
  if (seeker.location) parts.push(`, based in ${seeker.location}`);
  parts.push(".");

  if (seeker.yearsExperience) {
    parts.push(` They bring ${seeker.yearsExperience} of professional experience`);
  }
  if (seeker.skills.length > 0) {
    parts.push(
      seeker.yearsExperience ? ", with strengths in " : " Their strengths include "
    );
    parts.push(
      seeker.skills
        .slice(0, 3)
        .map((s) => displaySkill(s).replace(/\s*\([^)]*\)/, ""))
        .join(", ")
    );
    if (seeker.skills.length > 3) parts.push(", and more");
    parts.push(".");
  } else {
    parts.push(" View their experience and credentials below.");
  }

  if (trimmed) parts.push(`\n\n${trimmed}`);

  return parts.join("");
}

function ExperienceRow({ raw }: { raw: string }) {
  const { title, company, startDate, endDate, description } = parseWorkExperience(raw);
  const dates = [startDate, endDate].filter(Boolean).join(" – ");

  return (
    <li className="border-b border-ink/[0.06] py-5 last:border-b-0">
      <p className="font-display text-base font-bold text-ink">{title || "Role"}</p>
      {company && <p className="mt-0.5 text-sm font-medium text-ink/55">{company}</p>}
      {dates && <p className="mt-1 font-data text-xs text-ink/45">{dates}</p>}
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{description}</p>
      )}
    </li>
  );
}

function EducationRow({ raw }: { raw: string }) {
  const { school, degree, field, year } = parseEducation(raw);
  const degreeLine = [degree, field].filter(Boolean).join(", ");

  return (
    <li className="border-b border-ink/[0.06] py-4 last:border-b-0">
      {degreeLine && <p className="font-display text-sm font-bold text-ink">{degreeLine}</p>}
      {school && <p className="mt-0.5 text-sm text-ink/55">{school}</p>}
      {year && <p className="mt-1 font-data text-xs text-ink/45">{year}</p>}
      {!degreeLine && !school && (
        <p className="text-sm text-ink/70">{displayEducation(raw)}</p>
      )}
    </li>
  );
}

export default function PublicSeekerProfileSections({ seeker }: { seeker: PublicSeekerData }) {
  const facts = buildFacts(seeker);
  const aboutText = buildAboutParagraph(seeker);

  return (
    <div className="space-y-10">
      {facts.length > 0 && (
        <section aria-label="Profile at a glance">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/35">
            At a glance
          </p>
          <div className="grid grid-cols-1 divide-y divide-ink/[0.06] border-y border-ink/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
            {facts.map((fact) => (
              <FactCell key={fact.label} {...fact} />
            ))}
          </div>
        </section>
      )}

      {seeker.skills.length > 0 && (
        <section>
          <h2 className="font-display text-base font-bold text-ink">Skills & specializations</h2>
          <p className="mt-1 text-xs text-ink/45">What this candidate brings to client work.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {seeker.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-marigold/25 bg-marigold/10 px-3 py-1 text-xs font-semibold text-[#8a5a10]"
              >
                {displaySkill(skill)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-base font-bold text-ink">About</h2>
        <p className="mt-1 text-xs text-ink/45">Background, working style, and what they&apos;re looking for.</p>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-[1.75] text-ink/75">{aboutText}</div>
      </section>

      {seeker.workExperience.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-marigold/70" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink">Experience</h2>
          </div>
          <ul className="border-y border-ink/[0.06]">
            {seeker.workExperience.map((entry) => (
              <ExperienceRow key={entry} raw={entry} />
            ))}
          </ul>
        </section>
      )}

      {seeker.education.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-navy/60" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink">Education</h2>
          </div>
          <ul className="border-y border-ink/[0.06]">
            {seeker.education.map((entry) => (
              <EducationRow key={entry} raw={entry} />
            ))}
          </ul>
        </section>
      )}

      {seeker.languages.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Languages className="h-4 w-4 text-teal/70" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink">Languages</h2>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {seeker.languages.map((lang) => (
              <li
                key={lang}
                className="border-b border-ink/[0.06] py-2 text-sm text-ink/75 sm:border-b-0 sm:py-1"
              >
                {displayLanguage(lang)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {seeker.certifications.length > 0 && (
        <section>
          <h2 className="font-display text-base font-bold text-ink">Certifications</h2>
          <ul className="mt-3 space-y-2">
            {seeker.certifications.map((cert) => (
              <li key={cert} className="text-sm text-ink/75">
                {displayCertification(cert)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(seeker.resumeUrl || seeker.linkedinUrl || seeker.portfolioUrl) && (
        <section className="border-t border-ink/[0.06] pt-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/35">
            Links & documents
          </p>
          <div className="flex flex-wrap gap-4">
            {seeker.resumeUrl && (
              <a
                href={seeker.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-marigold hover:text-marigold/80"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                View resume
              </a>
            )}
            {seeker.linkedinUrl && (
              <a
                href={seeker.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-teal"
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
                LinkedIn
              </a>
            )}
            {seeker.portfolioUrl && (
              <a
                href={seeker.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-teal"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Portfolio
              </a>
            )}
          </div>
        </section>
      )}

      <p className="border-t border-ink/[0.06] pt-6 text-xs text-ink/40">
        Profile updated {formatRelativeUpdated(seeker.updatedAt)}
      </p>
    </div>
  );
}
