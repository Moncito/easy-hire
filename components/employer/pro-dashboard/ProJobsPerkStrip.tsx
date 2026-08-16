import Link from "next/link";
import { Bolt, Layers, Star } from "lucide-react";

type Props = {
  companyVerified: boolean;
};

const PERKS = [
  {
    icon: Bolt,
    title: "Go live instantly",
    body: "Verified Pro listings skip the admin queue and publish now.",
  },
  {
    icon: Layers,
    title: "Unlimited roles",
    body: "No cap on live jobs — post as many openings as you need.",
  },
  {
    icon: Star,
    title: "Feature any listing",
    body: "Pin a role to the top of search so more VAs see it first.",
  },
];

export default function ProJobsPerkStrip({ companyVerified }: Props) {
  return (
    <div className="mb-8">
      {!companyVerified && (
        <p className="mb-3 text-sm leading-relaxed text-ink/60">
          Instant publish unlocks after{" "}
          <Link href="/employer/company-profile" className="font-semibold text-[#9A5B12] hover:underline">
            company verification
          </Link>
          . Pro never skips that step — only the admin job-review wait.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PERKS.map((perk) => {
          const Icon = perk.icon;
          const muted = perk.title === "Go live instantly" && !companyVerified;
          return (
            <div
              key={perk.title}
              className={`pro-card flex gap-3 p-4 ${muted ? "opacity-70" : ""}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink">
                <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{perk.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{perk.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
