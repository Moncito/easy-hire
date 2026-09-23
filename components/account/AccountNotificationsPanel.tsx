"use client";

import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";

type Role = "SEEKER" | "EMPLOYER";

type Preferences = {
  notifyMessages: boolean;
  notifyApplicationUpdates: boolean;
  notifyProductDigest: boolean;
};

type FieldKey = keyof Preferences;

const FIELD_ORDER: FieldKey[] = ["notifyMessages", "notifyApplicationUpdates", "notifyProductDigest"];

function labelsForRole(role: Role): Record<FieldKey, { title: string; description: string }> {
  return {
    notifyMessages: {
      title: "Messages",
      description: "Email me when someone sends me a message.",
    },
    notifyApplicationUpdates:
      role === "EMPLOYER"
        ? { title: "Application updates", description: "Email me when someone applies to one of my jobs." }
        : {
            title: "Application updates",
            description: "Email me about status changes and decisions on my applications.",
          },
    notifyProductDigest:
      role === "EMPLOYER"
        ? { title: "Product digests", description: "The weekly Easy AI summary of your hiring activity." }
        : { title: "Product digests", description: "The job-alert digest for new matching roles." },
  };
}

function normalizePreferences(data: unknown): Preferences {
  const record = (data ?? {}) as Partial<Record<FieldKey, unknown>>;
  return {
    notifyMessages: Boolean(record.notifyMessages),
    notifyApplicationUpdates: Boolean(record.notifyApplicationUpdates),
    notifyProductDigest: Boolean(record.notifyProductDigest),
  };
}

/**
 * Self-loading by design: GET on mount, PATCH per toggle. Decoupled from the
 * two settings pages on purpose — see the account-settings rebuild notes —
 * so this panel doesn't need initial values passed as props and can ship
 * against /api/account/notification-preferences independently.
 */
export default function AccountNotificationsPanel({ role }: { role: Role }) {
  const isEmployer = role === "EMPLOYER";

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingField, setPendingField] = useState<FieldKey | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const baseId = useId();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/account/notification-preferences");
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (cancelled) return;
        setPreferences(normalizePreferences(data));
      } catch {
        if (!cancelled) {
          setLoadError("Couldn't load your notification preferences. Please refresh to try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle(field: FieldKey) {
    if (!preferences || pendingField) return;

    const previous = preferences;
    const nextValue = !preferences[field];
    const { title } = labelsForRole(role)[field];

    setPreferences({ ...preferences, [field]: nextValue });
    setPendingField(field);
    setFieldError(null);
    setStatus(`${title} turned ${nextValue ? "on" : "off"}.`);

    try {
      const res = await fetch("/api/account/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      setPreferences(normalizePreferences(data));
    } catch {
      setPreferences(previous);
      const message = `Couldn't update ${title.toLowerCase()}. Please try again.`;
      setFieldError(message);
      setStatus(message);
    } finally {
      setPendingField(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="px-5 pt-5 sm:px-6">
        <p className="max-w-2xl text-sm leading-relaxed text-ink/60">
          Choose what EasyHire emails you about. Account-security emails and interview
          invitations are always sent and can&apos;t be turned off here.
        </p>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>

      {loadError && (
        <div role="alert" className="mx-5 mt-4 mb-5 rounded-xl border border-ember/25 bg-ember/5 px-4 py-3 text-sm text-ember sm:mx-6 sm:mb-6">
          {loadError}
        </div>
      )}

      {loading && !loadError && (
        <div className="space-y-3 px-5 py-5 sm:px-6" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-ink/[0.05]" />
          ))}
        </div>
      )}

      {!loading && preferences && (
        <ul className="mt-4 divide-y divide-ink/[0.06] px-5 pb-5 sm:px-6 sm:pb-6">
          {FIELD_ORDER.map((field) => {
            const { title, description } = labelsForRole(role)[field];
            const checked = preferences[field];
            const busy = pendingField === field;
            const switchId = `${baseId}-${field}`;
            const labelId = `${switchId}-label`;

            return (
              <li key={field} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <label id={labelId} htmlFor={switchId} className="block cursor-pointer text-sm font-semibold text-ink">
                    {title}
                  </label>
                  <p className="mt-0.5 text-sm text-ink/55">{description}</p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-2">
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/40" aria-hidden="true" />}
                  <button
                    id={switchId}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-labelledby={labelId}
                    aria-busy={busy}
                    disabled={pendingField !== null}
                    onClick={() => handleToggle(field)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      checked ? (isEmployer ? "bg-teal" : "bg-marigold") : "bg-ink/15"
                    } ${isEmployer ? "focus-visible:ring-teal" : "focus-visible:ring-marigold"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-[22px]" : "translate-x-1"
                      }`}
                    />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {fieldError && (
        <p role="alert" className="px-5 pb-5 text-sm text-ember sm:px-6 sm:pb-6">
          {fieldError}
        </p>
      )}
    </div>
  );
}
