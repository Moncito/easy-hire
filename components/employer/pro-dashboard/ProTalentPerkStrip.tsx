import Link from "next/link";
import { Bookmark, MessageSquare, Sparkles } from "lucide-react";

const PERKS = [
  {
    href: "/employer/talent/lists",
    icon: Bookmark,
    title: "Saved lists",
    body: "Group VAs into named shortlists for a role or a hiring round.",
  },
  {
    href: "/employer/messages",
    icon: MessageSquare,
    title: "Message on-platform",
    body: "Start a thread from any profile. No email chase, no LinkedIn hop.",
  },
  {
    href: "/employer/easy-ai",
    icon: Sparkles,
    title: "Easy AI rank",
    body: "Score applicants on a job. You confirm every shortlist move.",
  },
];

export default function ProTalentPerkStrip() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PERKS.map((perk) => {
        const Icon = perk.icon;
        return (
          <Link
            key={perk.title}
            href={perk.href}
            className="pro-card flex gap-3 p-4 transition hover:border-ink/15 hover:shadow-md"
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
  );
}
