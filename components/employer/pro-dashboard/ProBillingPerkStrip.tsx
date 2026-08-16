import Link from "next/link";
import { BadgeCheck, Layers, Sparkles } from "lucide-react";

type Props = {
  companyVerified: boolean;
};

export default function ProBillingPerkStrip({ companyVerified }: Props) {
  const perks = [
    {
      href: companyVerified ? "/employer/jobs/new" : "/employer/company-profile",
      icon: BadgeCheck,
      title: "Instant publish",
      body: companyVerified
        ? "You're verified. New listings skip the admin queue and go live now."
        : "Unlocks after company verification. Pro never skips that step.",
      muted: !companyVerified,
    },
    {
      href: "/employer/jobs",
      icon: Layers,
      title: "Unlimited live jobs",
      body: "No 3-role cap. Feature listings and keep as many openings active as you need.",
      muted: false,
    },
    {
      href: "/employer/easy-ai",
      icon: Sparkles,
      title: "Easy AI + exports",
      body: "Rank, outreach drafts, hiring narrative, and CSV — you confirm every AI action.",
      muted: false,
    },
  ];

  return (
    <div className="mb-8">
      {!companyVerified && (
        <p className="mb-3 text-sm leading-relaxed text-ink/60">
          Instant publish waits on{" "}
          <Link href="/employer/company-profile" className="font-semibold text-[#9A5B12] hover:underline">
            company verification
          </Link>
          . Pro never skips that — only the admin job-review queue.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {perks.map((perk) => {
          const Icon = perk.icon;
          return (
            <Link
              key={perk.title}
              href={perk.href}
              className={`pro-card flex gap-3 p-4 transition hover:border-ink/15 hover:shadow-md ${
                perk.muted ? "opacity-80" : ""
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink">
                <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{perk.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{perk.body}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
