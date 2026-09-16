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
export default function MoneyBandCard({ money }: { money: MoneyBand }) {
  return (
    <section aria-labelledby="money-band-heading">
      <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/40 p-5 admin-dark:border-white/15 admin-dark:bg-white/5">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-ink/20 bg-ink/5 text-ink/40 admin-dark:border-white/20 admin-dark:bg-white/10 admin-dark:text-mist/50"
            aria-hidden="true"
          >
            <CircleDashed className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="money-band-heading"
              className="font-display text-xl font-bold tracking-tight text-ink admin-dark:text-mist"
            >
              Money
            </h2>
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/20 bg-ink/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink/50 admin-dark:border-white/20 admin-dark:bg-white/10 admin-dark:text-mist/55">
              Not available yet
            </p>
            <p className="mt-3 max-w-2xl text-sm text-ink/60 admin-dark:text-mist/60">{money.reason}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
