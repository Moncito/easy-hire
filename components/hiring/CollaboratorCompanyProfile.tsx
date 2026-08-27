import Link from "next/link";
import { ExternalLink, Globe, MapPin, ShieldCheck, Users } from "lucide-react";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import type { Company } from "@prisma/client";

type Props = {
  companyId: string;
  company: Company;
  activeJobsCount: number;
  totalApplicantsCount: number;
};

const verificationCopy: Record<Company["verifiedStatus"], { label: string; tone: string }> = {
  APPROVED: { label: "Verified", tone: "text-teal" },
  PENDING: { label: "Verification pending", tone: "text-[#9A5B12]" },
  REJECTED: { label: "Verification needs an update", tone: "text-ember" },
};

export default function CollaboratorCompanyProfile({ companyId, company, activeJobsCount, totalApplicantsCount }: Props) {
  const verification = verificationCopy[company.verifiedStatus];
  return (
    <>
        <header className="flex items-start justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="flex min-w-0 items-center gap-4">
            <EmployerAvatar name={company.companyName} imageUrl={company.logoUrl} size="lg" shape="rounded" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9A5B12]">Company profile</p>
              <h1 className="mt-1 font-display text-3xl font-black tracking-tight">{company.companyName}</h1>
              <p className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${verification.tone}`}><ShieldCheck className="h-4 w-4" />{verification.label}</p>
            </div>
          </div>
          <Link href={`/companies/${company.id}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/10 px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-[#9A5B12]/40 hover:text-[#9A5B12]"><ExternalLink className="h-3.5 w-3.5" />Public page</Link>
        </header>

        <section className="mt-6 flex flex-wrap gap-6 border-b border-ink/10 pb-6 text-sm text-ink/60">
          <span><span className="font-data font-semibold text-ink">{activeJobsCount}</span> active role{activeJobsCount === 1 ? "" : "s"}</span>
          <span><span className="font-data font-semibold text-ink">{totalApplicantsCount}</span> applicant{totalApplicantsCount === 1 ? "" : "s"}</span>
          {company.industry && <span>{company.industry}</span>}
          {company.teamSize && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{company.teamSize}</span>}
          {company.headquarters && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{company.headquarters}</span>}
          {company.foundedYear && <span>Founded {company.foundedYear}</span>}
        </section>

        {company.description && (
          <section className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">About</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/70">{company.description}</p>
          </section>
        )}

        {company.highlights.length > 0 && (
          <section className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Highlights</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {company.highlights.map((highlight) => <li key={highlight} className="rounded-full bg-marigold/10 px-3 py-1 text-xs font-semibold text-[#9A5B12]">{highlight}</li>)}
            </ul>
          </section>
        )}

        <section className="mt-6 flex flex-wrap gap-4 text-sm">
          {company.website && <SocialLink href={company.website} label="Website" />}
          {company.linkedinUrl && <SocialLink href={company.linkedinUrl} label="LinkedIn" />}
          {company.facebookUrl && <SocialLink href={company.facebookUrl} label="Facebook" />}
          {company.instagramUrl && <SocialLink href={company.instagramUrl} label="Instagram" />}
        </section>

        <p className="mt-8 text-xs text-ink/40">Editing the company profile is limited to the account owner.</p>
    </>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 font-semibold text-ink/70 transition hover:border-[#9A5B12]/40 hover:text-[#9A5B12]"><Globe className="h-4 w-4" />{label}</a>;
}
