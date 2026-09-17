import { CheckCircle2, CircleDashed } from "lucide-react";

/**
 * Shared "what does this flag actually do" rendering — used by both the
 * table and the editor, so the semantics are stated identically everywhere
 * a flag appears. Transcribed straight from `isFeatureEnabled`'s doc comment
 * in `lib/admin/feature-flags.ts`, not re-derived:
 *
 *   - `enabled: false` -> off, regardless of `rolloutPercentage`. The stored
 *     percentage is inert while off, so it renders as "n/a", never a `0%`
 *     that could be mistaken for "0% of users get it because the rollout is
 *     configured that low" (a fabricated-looking value, same discipline as
 *     the system-health "not instrumented" state never rendering as a `0`).
 *   - `enabled: true`, `rolloutPercentage: null` -> fully on, no per-user
 *     gate at all.
 *   - `enabled: true`, `rolloutPercentage: N` -> a DETERMINISTIC per-user
 *     bucket (same key+userId always resolves the same way — see
 *     `computeRolloutBucket`), never a per-request coin flip.
 */

export function EnabledPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        enabled ? "bg-teal/10 text-teal" : "bg-ink/5 text-ink/45"
      }`}
    >
      {enabled ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      {enabled ? "On" : "Off"}
    </span>
  );
}

export function RolloutCell({ enabled, rolloutPercentage }: { enabled: boolean; rolloutPercentage: number | null }) {
  if (!enabled) {
    return (
      <span className="font-data text-xs text-ink/35">
        n/a <span className="text-[10px]">(off overrides any %)</span>
      </span>
    );
  }
  if (rolloutPercentage === null) {
    return (
      <span className="font-data text-xs font-semibold text-teal">
        100% <span className="text-[10px] font-normal text-ink/45">(fully on)</span>
      </span>
    );
  }
  return (
    <span className="font-data text-xs font-semibold text-ink">
      {rolloutPercentage}% <span className="text-[10px] font-normal text-ink/45">(deterministic per-user)</span>
    </span>
  );
}
