import Link from "next/link";
import { Download, Sparkles, Search } from "lucide-react";

const PERKS = [
  {
    href: "/api/employer/exports/applicants",
    icon: Download,
    title: "Export CSV",
    body: "Download every applicant across jobs — Free cannot export.",
    external: true,
  },
  {
    href: "/employer/easy-ai",
    icon: Sparkles,
    title: "Easy AI rank",
    body: "Score a candidate inside the job pipeline. You confirm every move.",
    external: false,
  },
  {
    href: "/employer/talent",
    icon: Search,
    title: "Browse talent",
    body: "Don’t wait on inbound. Search VAs and save them to lists.",
    external: false,
  },
];

export default function ProApplicantsPerkStrip() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PERKS.map((perk) => {
        const Icon = perk.icon;
        const className =
          "pro-card flex gap-3 p-4 transition hover:border-ink/15 hover:shadow-md";
        const inner = (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink">
              <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{perk.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{perk.body}</p>
            </div>
          </>
        );

        if (perk.external) {
          return (
            <a key={perk.title} href={perk.href} className={className}>
              {inner}
            </a>
          );
        }

        return (
          <Link key={perk.title} href={perk.href} className={className}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
