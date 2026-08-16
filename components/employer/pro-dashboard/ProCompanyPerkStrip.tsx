import Link from "next/link";
import { BadgeCheck, ExternalLink, Sparkles } from "lucide-react";

type Props = {
  companyVerified: boolean;
  publicHref: string;
};

export default function ProCompanyPerkStrip({ companyVerified, publicHref }: Props) {
  const perks = [
    {
      href: "#verification",
      icon: BadgeCheck,
      title: "Company verification",
      body: companyVerified
        ? "You're verified. New listings skip the admin queue and go live instantly."
        : "Required for Pro and Free. Instant publish unlocks only after approval.",
    },
    {
      href: publicHref,
      icon: ExternalLink,
      title: "Public company page",
      body: "Logo, banner, and About are what VAs see before they apply.",
      external: true,
    },
    {
      href: "/employer/easy-ai",
      icon: Sparkles,
      title: "Easy AI About",
      body: "Draft brand copy from what's here. You review every line before it saves.",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {perks.map((perk) => {
        const Icon = perk.icon;
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
        const className = "pro-card flex gap-3 p-4 transition hover:border-ink/15 hover:shadow-md";

        if ("external" in perk && perk.external) {
          return (
            <a
              key={perk.title}
              href={perk.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
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
