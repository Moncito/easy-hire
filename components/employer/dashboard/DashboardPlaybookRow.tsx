import Link from "next/link";
import { Briefcase, Search, Share2, Users, ArrowUpRight } from "lucide-react";

const actions = [
  {
    href: "/employer/jobs/new",
    icon: Briefcase,
    label: "Post a role",
    description: "Publish a listing and reach qualified VAs today.",
    accent: "teal" as const,
  },
  {
    href: "/employer/talent",
    icon: Search,
    label: "Search talent",
    description: "Proactively discover skilled candidates in the pool.",
    accent: "navy" as const,
  },
  {
    href: "/employer/applicants",
    icon: Users,
    label: "Review pipeline",
    description: "Move applicants forward through your hiring stages.",
    accent: "navy" as const,
  },
  {
    href: "/employer/jobs",
    icon: Share2,
    label: "Share listings",
    description: "Copy links and promote jobs on social channels.",
    accent: "teal" as const,
  },
];

export default function DashboardPlaybookRow() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`employer-ws-playbook-card group relative overflow-hidden rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              action.accent === "teal"
                ? "employer-ws-playbook-teal border-teal/15 hover:border-teal/25 hover:shadow-teal/10"
                : "employer-ws-playbook-navy border-navy/10 hover:border-navy/20 hover:shadow-navy/10"
            }`}
          >
            <div
              className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                action.accent === "teal" ? "bg-teal/12 text-teal" : "bg-navy/8 text-navy"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <p className="text-sm font-bold text-ink group-hover:text-teal">{action.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/50">{action.description}</p>
            <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-ink/20 transition group-hover:text-teal" />
          </Link>
        );
      })}
    </div>
  );
}
