import type { ComponentType } from "react";
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  Briefcase,
  ShieldCheck,
  Link2,
} from "lucide-react";

type CompanyAboutProps = {
  companyName: string;
  description: string | null;
  industry: string | null;
  teamSize: string | null;
  headquarters: string | null;
  foundedYear: number | null;
  highlights: string[];
  verifiedStatus: string;
  openRolesCount: number;
  website: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
};

type Fact = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
};

const CARD =
  "rounded-xl border border-[#E4E2DC] bg-white shadow-[0_1px_2px_rgba(17,17,16,0.04),0_6px_18px_rgba(17,17,16,0.06)]";

function FactCell({ icon: Icon, label, value, hint }: Fact) {
  return (
    <div className={`${CARD} min-w-0 px-5 py-4`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[#A8A49D]">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p className="text-[11px] font-bold uppercase tracking-[0.9px]">{label}</p>
      </div>
      <p className="text-[0.9rem] font-bold leading-snug text-[#111110]">{value}</p>
      {hint && <p className="mt-1 text-[0.74rem] leading-snug text-[#A8A49D]">{hint}</p>}
    </div>
  );
}

function buildFacts(props: CompanyAboutProps): Fact[] {
  const facts: Fact[] = [];

  if (props.industry) {
    facts.push({
      icon: Building2,
      label: "Industry",
      value: props.industry,
      hint: "Primary sector on EasyHire",
    });
  }

  if (props.teamSize) {
    facts.push({
      icon: Users,
      label: "Team size",
      value: `${props.teamSize} employees`,
      hint: "Reported company size",
    });
  }

  if (props.headquarters) {
    facts.push({
      icon: MapPin,
      label: "Headquarters",
      value: props.headquarters,
      hint: "Base of operations",
    });
  }

  if (props.foundedYear) {
    facts.push({
      icon: Calendar,
      label: "Founded",
      value: String(props.foundedYear),
    });
  }

  facts.push({
    icon: Briefcase,
    label: "Open roles",
    value: props.openRolesCount === 1 ? "1 active listing" : `${props.openRolesCount} active listings`,
    hint: props.openRolesCount > 0 ? "Apply directly on EasyHire" : "Check back soon",
  });

  if (props.verifiedStatus === "APPROVED") {
    facts.push({
      icon: ShieldCheck,
      label: "Trust",
      value: "Verified employer",
      hint: "Reviewed by EasyHire",
    });
  }

  return facts;
}

function buildAboutParagraph(props: CompanyAboutProps): string {
  const trimmed = props.description?.trim();
  if (trimmed && trimmed.length >= 40) return trimmed;

  const parts: string[] = [];
  parts.push(
    `${props.companyName} is ${props.verifiedStatus === "APPROVED" ? "a verified employer" : "an employer"} on EasyHire`
  );

  if (props.industry) parts.push(` operating in ${props.industry}`);
  if (props.headquarters) parts.push(`, based in ${props.headquarters}`);
  parts.push(".");

  if (props.openRolesCount > 0) {
    parts.push(
      ` They currently have ${props.openRolesCount} active ${props.openRolesCount === 1 ? "role" : "roles"} for Filipino virtual assistants — browse listings below and apply in one click.`
    );
  } else {
    parts.push(" Follow their profile for new VA openings.");
  }

  if (trimmed) parts.push(`\n\n${trimmed}`);

  return parts.join("");
}

const socialDefs = [
  { key: "linkedinUrl" as const, label: "LinkedIn" },
  { key: "facebookUrl" as const, label: "Facebook" },
  { key: "instagramUrl" as const, label: "Instagram" },
  { key: "xUrl" as const, label: "X" },
];

export default function CompanyAboutSection(props: CompanyAboutProps) {
  const facts = buildFacts(props);
  const aboutText = buildAboutParagraph(props);

  const socials = socialDefs
    .map(({ key, label }) => {
      const href = props[key];
      return href ? { href, label } : null;
    })
    .filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="space-y-8">
      {facts.length > 0 && (
        <section aria-label="Company at a glance">
          <p className="mb-3 text-[0.8rem] font-bold uppercase tracking-[1px] text-[#A8A49D]">
            At a glance
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact) => (
              <FactCell key={fact.label} {...fact} />
            ))}
          </div>
        </section>
      )}

      <section className={`${CARD} p-5 sm:p-6`}>
        <h2 className="font-display text-base font-bold text-[#111110]">About the company</h2>
        <p className="mt-1 text-xs text-[#A8A49D]">
          Who they are, where they work, and why they hire on EasyHire.
        </p>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-[1.75] text-[#374140]">{aboutText}</div>

        {props.highlights.length > 0 && (
          <div className="mt-6 border-t border-[#E4E2DC] pt-6">
            <p className="text-[0.8rem] font-bold uppercase tracking-[1px] text-[#A8A49D]">
              Culture & highlights
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {props.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-xs font-semibold text-[#165E54]"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {socials.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E4E2DC] pt-6">
            {socials.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E4E2DC] bg-white px-3.5 py-2 text-sm font-medium text-[#374140] transition hover:border-teal hover:text-teal"
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
