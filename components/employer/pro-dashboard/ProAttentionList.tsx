import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MessageSquare, Megaphone } from "lucide-react";
import type { DashboardAttentionItem } from "@/lib/employer/dashboard-attention";

const ICONS: Record<DashboardAttentionItem["id"], typeof Clock> = {
  "needs-review": Clock,
  "unread-messages": MessageSquare,
  "quiet-roles": Megaphone,
};

/**
 * The one place the dashboard asks for action, ranked by urgency (see
 * buildDashboardAttention). Amber marks something gone stale; nothing here
 * uses Ember, which is reserved for real errors and rejections.
 */
export default function ProAttentionList({ items }: { items: DashboardAttentionItem[] }) {
  if (items.length === 0) {
    return (
      <section className="pro-card flex items-center gap-3 px-5 py-4 sm:px-6">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
        <p className="text-sm text-ink/70">
          <span className="font-semibold text-ink">You&apos;re all caught up.</span> Nothing is waiting on you.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="pro-attention-heading" className="pro-card overflow-hidden !p-0">
      <h2 id="pro-attention-heading" className="px-5 pb-2 pt-4 text-base font-semibold text-ink sm:px-6">
        Needs your attention
      </h2>
      <ul className="divide-y divide-ink/[0.06] border-t border-ink/[0.06]">
        {items.map((item) => {
          const Icon = ICONS[item.id];
          const warning = item.tone === "warning";
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-ink/[0.02] focus-visible:bg-ink/[0.03] focus-visible:outline-none sm:px-6"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    warning ? "bg-marigold/15 text-[#9A5B12]" : "bg-ink/[0.05] text-ink/50"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{item.title}</span>
                  {item.detail && (
                    <span className={`mt-0.5 block truncate text-xs ${warning ? "font-medium text-[#9A5B12]" : "text-ink/50"}`}>
                      {item.detail}
                    </span>
                  )}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink/60 transition group-hover:text-ink">
                  {item.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
