import Link from "next/link";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { Briefcase, Building2, Clock, CheckCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();

  const [pendingJobs, pendingCompanies, publicLiveJobs, approvedToday] = await Promise.all([
    prisma.job.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.company.count({ where: { verifiedStatus: "PENDING" } }),
    prisma.job.count({
      where: { status: "ACTIVE", company: { verifiedStatus: "APPROVED" } },
    }),
    prisma.job.count({
      where: {
        status: "ACTIVE",
        publishedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        company: { verifiedStatus: "APPROVED" },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Admin dashboard</h1>
        <p className="mt-2 text-sm text-ink/55">Signed in as {session?.user?.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Companies to verify", value: pendingCompanies, icon: Building2, href: "/admin/companies" },
          { label: "Jobs to review", value: pendingJobs, icon: Clock, href: "/admin/jobs" },
          { label: "Public live jobs", value: publicLiveJobs, icon: CheckCircle, href: "/jobs" },
          { label: "Published today", value: approvedToday, icon: Briefcase, href: "/admin/jobs" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-2xl border border-ink/5 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">{stat.label}</span>
                <Icon className="h-4 w-4 text-navy/50" aria-hidden="true" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-ink">{stat.value}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
