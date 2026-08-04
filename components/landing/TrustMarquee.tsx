"use client";

import type { CSSProperties } from "react";
import type { LandingCompany } from "@/lib/landing";

interface TrustMarqueeProps {
  companies: LandingCompany[];
}

/** Repeat items until we have enough to fill a wide track (avoids a short static strip). */
function padForMarquee<T>(items: T[], minCount = 8): T[] {
  if (items.length === 0) return items;
  const out: T[] = [];
  while (out.length < minCount) {
    out.push(...items);
  }
  return out;
}

export default function TrustMarquee({ companies }: TrustMarqueeProps) {
  if (companies.length === 0) return null;

  const loop = padForMarquee(companies, 8);

  return (
    <section className="w-full bg-mist py-10">
      <p className="mb-6 text-center text-xs font-semibold tracking-widest uppercase text-ink/50">
        Verified employers hiring on EasyHire
      </p>

      <div className="landing-marquee-hover landing-marquee-mask overflow-hidden">
        <div
          className="landing-marquee gap-10"
          style={{ "--marquee-duration": "35s" } as CSSProperties}
        >
          {/* Copy A — exactly 50% of track width */}
          <div className="flex shrink-0 items-center gap-10 pr-10">
            {loop.map((company, i) => (
              <CompanyItem key={`a-${company.id}-${i}`} company={company} />
            ))}
          </div>
          {/* Copy B — identical, for seamless -50% loop */}
          <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
            {loop.map((company, i) => (
              <CompanyItem key={`b-${company.id}-${i}`} company={company} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyItem({ company }: { company: LandingCompany }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      {company.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.logoUrl}
          alt={company.companyName}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-ink/10"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10">
          <span className="font-display text-xs font-bold text-navy">
            {company.companyName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="whitespace-nowrap font-medium text-sm text-ink/70">
        {company.companyName}
      </span>
    </div>
  );
}
