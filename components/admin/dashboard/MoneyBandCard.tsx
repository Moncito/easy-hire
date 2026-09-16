import { CircleDashed } from "lucide-react";
import type { MoneyBand } from "@/lib/admin/home-dashboard";

/**
 * Band 2 — Money (docs/ADMIN-CONSOLE-PLAN.md §4.1). `MoneyBand` is a
 * discriminated union with exactly one member today — `{ status: "blocked",
 * reason }` — structurally incapable of carrying an MRR/ARPU/margin number
 * (see `lib/admin/home-dashboard.ts`'s own doc comment). This renders as ONE
 * clear, deliberate "not available yet" card, matching
 * `components/admin/system/NotInstrumentedPanel.tsx`'s dashed/neutral visual
 * language — never four empty tiles pretending to be MRR/ARPU/churn/margin.
 * This band should read as "we know exactly why this isn't here," not as a
 * broken layout — so the reason string renders as real, full sentence text,
 * not a truncated tooltip.
 */
/**
 * Deliberately compact — a full-size card here would give a band with
 * genuinely nothing to report the same visual footprint as Marketplace
 * pulse or Work, both of which carry real signal. A slim banner still says
 * "we know exactly why this isn't here" without competing for attention.
 */
export default function MoneyBandCard({ money }: { money: MoneyBand }) {
  return (
    <section aria-labelledby="money-band-heading">
      <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-ink/15 bg-mist/40 px-4 py-3 admin-dark:border-white/15 admin-dark:bg-white/5">
        <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-ink/35 admin-dark:text-mist/40" aria-hidden="true" />
        <div className="min-w-0">
          <h2
            id="money-band-heading"
            className="inline-flex items-center gap-2 font-display text-sm font-bold tracking-tight text-ink admin-dark:text-mist"
          >
            Money
            <span className="rounded-full border border-dashed border-ink/20 bg-ink/5 px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-ink/50 admin-dark:border-white/20 admin-dark:bg-white/10 admin-dark:text-mist/55">
              Not available yet
            </span>
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-ink/55 admin-dark:text-mist/55">{money.reason}</p>
        </div>
      </div>
    </section>
  );
}
