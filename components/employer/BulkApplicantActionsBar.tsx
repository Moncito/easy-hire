"use client";

const STAGE_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
];

type Props = {
  selectedCount: number;
  loading?: boolean;
  onClear: () => void;
  onMove: (status: string) => void;
  onReject: () => void;
};

export default function BulkApplicantActionsBar({
  selectedCount,
  loading = false,
  onClear,
  onMove,
  onReject,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-teal/20 bg-teal/5 px-4 py-3">
      <span className="text-sm font-semibold text-ink">
        {selectedCount} {selectedCount === 1 ? "candidate" : "candidates"} selected
      </span>
      <select
        disabled={loading}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            onMove(e.target.value);
            e.target.value = "";
          }
        }}
        className="rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-teal"
        aria-label="Move selected to stage"
      >
        <option value="" disabled>
          Move to stage...
        </option>
        {STAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onReject}
        disabled={loading}
        className="rounded-lg border border-ember/20 px-3 py-1.5 text-xs font-semibold text-ember hover:bg-ember/5 disabled:opacity-60"
      >
        Reject selected
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={loading}
        className="ml-auto text-xs font-semibold text-ink/50 hover:text-ink disabled:opacity-60"
      >
        Clear selection
      </button>
    </div>
  );
}

export { STAGE_OPTIONS };
