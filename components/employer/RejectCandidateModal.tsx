"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  candidateName: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export default function RejectCandidateModal({
  open,
  candidateName,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  function handleConfirm() {
    onConfirm(reason.trim());
    setReason("");
  }

  function handleCancel() {
    setReason("");
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-xs" onClick={handleCancel} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="reject-modal-title"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="reject-modal-title" className="font-display text-lg font-bold text-ink">
          Reject {candidateName}?
        </h2>
        <p className="mt-2 text-sm text-ink/55">
          The candidate will receive an email notification. You can optionally include feedback to
          help them improve future applications.
        </p>

        <label htmlFor="rejection-reason" className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink/45">
          Feedback (optional)
        </label>
        <textarea
          id="rejection-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          rows={4}
          placeholder="e.g. We're looking for someone with more e-commerce experience..."
          className="mt-2 w-full rounded-xl border border-ink/10 p-3 text-sm text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
        />
        <p className="mt-1 text-right font-data text-[10px] text-ink/40">{reason.length}/500</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/3 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white hover:bg-ember/90 disabled:opacity-60"
          >
            {loading ? "Rejecting..." : "Confirm rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
