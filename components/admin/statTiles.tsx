/**
 * Shared "stat tile" primitives — small label+value cards used across
 * several admin detail/summary screens. Two variants existed independently
 * before this extraction (docs/ADMIN-UI-UPGRADE.md §2.3):
 *
 *  - `StatTile` — bordered, larger value text, optional `tone` for a muted
 *    or warn state. Was near-duplicated between `trust/TrustDirectory.tsx`
 *    (which defined it, and genuinely uses `tone="muted"`/`tone="warn"`)
 *    and `queue/DecisionQualityPanel.tsx` (as a second, unbordered-name
 *    `StatChip` missing only the `tone` prop).
 *  - `StatTileCompact` — no border, smaller value text. Was a
 *    BYTE-FOR-BYTE duplicate between `directory/CompanyDetailView.tsx` and
 *    `directory/RoleDetailSection.tsx`.
 *
 * These two remain visually distinct ON PURPOSE for now — unifying them
 * into one visual style (and aligning the larger dashboard/queues-index
 * stat cards to either one) is a real design decision, not a mechanical
 * dedup, and is left for the design pass tracked in
 * docs/ADMIN-UI-UPGRADE.md's "Your suggestions" section.
 */

export type StatTileTone = "default" | "muted" | "warn";

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: StatTileTone;
}) {
  const toneClass =
    tone === "warn"
      ? "text-ember"
      : tone === "muted"
        ? "text-ink/45 admin-dark:text-mist/45"
        : "text-ink admin-dark:text-mist";
  return (
    <div className="rounded-xl border border-ink/5 bg-mist/60 px-4 py-3 admin-dark:border-white/10 admin-dark:bg-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">{label}</p>
      <p className={`mt-1 font-data text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function StatTileCompact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-mist/60 px-3 py-2.5 admin-dark:bg-white/5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">{label}</p>
      <p className="mt-0.5 font-data text-lg font-semibold text-ink admin-dark:text-mist">{value}</p>
    </div>
  );
}
