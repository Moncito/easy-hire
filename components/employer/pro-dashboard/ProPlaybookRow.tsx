import Link from "next/link";
import { Briefcase, Search, Share2, Users, ArrowUpRight } from "lucide-react";

const actions = [
  {
    href: "/employer/jobs/new",
    icon: Briefcase,
    label: "Post a role",
    description: "Publish a listing and reach qualified VAs today.",
  },
  {
    href: "/employer/talent",
    icon: Search,
    label: "Search talent",
    description: "Proactively discover skilled candidates in the pool.",
  },
  {
    href: "/employer/applicants",
    icon: Users,
    label: "Review pipeline",
    description: "Move applicants forward through your hiring stages.",
  },
  {
    href: "/employer/jobs",
    icon: Share2,
    label: "Share listings",
    description: "Copy links and promote jobs on social channels.",
  },
];

export default function ProPlaybookRow() {
  return (
    <section aria-labelledby="pro-playbook-heading">
      <div className="mb-3">
        <h2 id="pro-playbook-heading" className="font-display text-lg font-black tracking-tighter text-ink">
          Hiring playbook
        </h2>
        <p className="mt-0.5 text-sm text-ink/45">Jump-start the pipeline from here.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="pro-card group relative overflow-hidden p-4 transition hover:border-ink/15 hover:shadow-md"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.06] text-ink">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <p className="text-sm font-bold text-ink group-hover:text-[#9A5B12]">{action.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/50">{action.description}</p>
              <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-ink/20 transition group-hover:text-[#9A5B12]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
