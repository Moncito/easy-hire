import Link from "next/link";
import { Bell, Bookmark, Briefcase, ChevronRight, Sparkles, UserRound, type LucideIcon } from "lucide-react";

export type SeekerQuickActionTone = "primary" | "navy" | "teal" | "default";

export type SeekerQuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  tone?: SeekerQuickActionTone;
};

export const DEFAULT_SEEKER_QUICK_ACTIONS: SeekerQuickAction[] = [
  { label: "Browse jobs", href: "/jobs", icon: Briefcase, tone: "primary" },
  { label: "See your matches", href: "/seeker/recommended", icon: Sparkles, tone: "teal" },
  { label: "Update profile", href: "/seeker/profile", icon: UserRound, tone: "navy" },
  { label: "Create job alert", href: "/seeker/job-alerts", icon: Bell, tone: "teal" },
  { label: "Saved jobs", href: "/seeker/saved-jobs", icon: Bookmark, tone: "navy" },
];

const TONE_CLASSES: Record<SeekerQuickActionTone, string> = {
  primary: "bg-marigold text-ink shadow-[0_2px_6px_rgba(242,169,59,0.35)]",
  navy: "bg-navy/10 text-navy",
  teal: "bg-teal/10 text-teal",
  default: "bg-ink/[0.04] text-ink/50",
};

type Props = {
  actions?: SeekerQuickAction[];
};

export default function SeekerQuickActionsCard({ actions = DEFAULT_SEEKER_QUICK_ACTIONS }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Quick actions</p>
      <ul className="space-y-1">
        {actions.map(({ label, href, icon: Icon, tone = "default" }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-ink/[0.03]"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-medium text-ink">{label}</span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-ink/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-marigold"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
