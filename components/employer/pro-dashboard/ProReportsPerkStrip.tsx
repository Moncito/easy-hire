import Link from "next/link";
import { Download, Sparkles, Timer } from "lucide-react";

const PERKS = [
  {
    href: "/api/employer/exports/applicants",
    icon: Download,
    title: "Export CSV",
    body: "Download every applicant across jobs. Free cannot export.",
    external: true,
  },
  {
    href: "/employer/applicants",
    icon: Timer,
    title: "Time-to-hire",
    body: "Average days from apply to hired — only on Reports, not the dashboard.",
    external: false,
  },
  {
    href: "/employer/easy-ai",
    icon: Sparkles,
    title: "Easy AI narrative",
    body: "A plain-language read of this week. You confirm before acting.",
    external: false,
  },
];

export default function ProReportsPerkStrip() {
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
