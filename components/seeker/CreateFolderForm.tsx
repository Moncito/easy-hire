"use client";

import { useId, useState } from "react";
import { fetchJsonSafe } from "@/lib/client/fetch-json";

export type CreatedFolder = { id: string; name: string };

type Props = {
  onCreated: (folder: CreatedFolder) => void;
  onCancel: () => void;
  /** "Create folder" (folder bar) vs "Create & add" (per-row add-to-folder menu). */
  submitLabel?: string;
  autoFocus?: boolean;
};

/**
 * The small "name this folder" form shared by SavedJobFolderBar's "New
 * folder" popover and SavedJobsPanel's per-row "Add to folder" menu. Both
 * callers own the surrounding menu/popover chrome and just need the field +
 * submit wired to POST /api/seeker/saved-job-folders.
 */
export default function CreateFolderForm({ onCreated, onCancel, submitLabel = "Create folder", autoFocus = true }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await fetchJsonSafe<CreatedFolder>("/api/seeker/saved-job-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="w-56 space-y-2 p-3">
      <label htmlFor={inputId} className="block text-xs font-semibold text-ink/60">
        Folder name
      </label>
      <input
        id={inputId}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        autoFocus={autoFocus}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        placeholder="e.g. Design leads"
        className="w-full rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-navy/25 focus:ring-2 focus:ring-navy/10"
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-ember">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-ink/55 transition hover:bg-ink/[0.05]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer rounded-lg bg-marigold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-marigold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
