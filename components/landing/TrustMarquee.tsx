"use client";

import React from "react";
import type { LandingCompany } from "@/lib/landing";

interface TrustMarqueeProps {
  companies: LandingCompany[];
}

export default function TrustMarquee({ companies }: TrustMarqueeProps) {
  if (companies.length === 0) return null;

  return (
    <section className="w-full bg-mist py-10">
      {/* Eyebrow */}
      <p className="mb-6 text-center text-xs font-semibold tracking-widest uppercase text-ink/50">
        Verified employers hiring on EasyHire
      </p>

      {/* Marquee viewport */}
      <div className="landing-marquee-hover landing-marquee-mask overflow-hidden">
        <div
          className="landing-marquee flex items-center gap-10 whitespace-nowrap"
          style={{ "--marquee-duration": "35s" } as React.CSSProperties}
        >
          {/* First copy */}
          {companies.map((company) => (
            <CompanyItem key={company.id} company={company} />
          ))}
          {/* Second copy — seamless loop */}
          <div aria-hidden="true" className="flex items-center gap-10">
            {companies.map((company) => (
              <CompanyItem key={`dup-${company.id}`} company={company} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyItem({ company }: { company: LandingCompany }) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-4">
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
      <span className="font-medium text-sm text-ink/70">{company.companyName}</span>
    </div>
  );
}
