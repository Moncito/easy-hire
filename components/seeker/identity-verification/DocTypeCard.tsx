import { useRef, useState } from "react";
import { CreditCard, Home, Loader2, Lock, ScanFace, Trash2, Upload, type LucideIcon } from "lucide-react";
import { formatRelativeUpdated } from "@/lib/seeker/profile-format";
import type { DocType, IdentityDocument } from "./shared";

const ICONS: Record<DocType, LucideIcon> = {
  GOVERNMENT_ID: CreditCard,
  PROOF_OF_ADDRESS: Home,
  SELFIE_WITH_ID: ScanFace,
  OTHER: CreditCard,
};

// Color-coded per type so the three cards scan as distinct categories at a
// glance, not just distinct icons — reuses tones already meaningful
// elsewhere in this exact panel (teal = verified/trust, e.g. the VERIFIED
// identity badge) rather than inventing new hues.
const TONE_CLASSES: Record<DocType, string> = {
  GOVERNMENT_ID: "bg-marigold/12 text-[#8a5a10]",
  PROOF_OF_ADDRESS: "bg-navy/10 text-navy",
  SELFIE_WITH_ID: "bg-teal/12 text-teal",
  OTHER: "bg-ink/8 text-ink/50",
};

type Props = {
  docType: DocType;
  label: string;
  hint: string;
  documents: IdentityDocument[];
  uploading: boolean;
  disabled: boolean;
  canDelete: boolean;
  confirmBeforeDelete: boolean;
  deletingId: string | null;
  openingId: string | null;
  onFiles: (docType: DocType, files: File[]) => void;
  onOpen: (doc: IdentityDocument) => void;
  onDelete: (id: string) => void;
};

/**
 * One upload slot per document type, matching the mockup's 3-card layout —
 * a visual restyle only. The backend still treats all documents as one
 * flexible list (any 1 of the 3 types unlocks review, per product
 * decision), so this card doesn't enforce "required"; it just shows this
 * type's own status and lets you add/remove documents of that type without
 * the old shared tab-switcher.
 */
export default function DocTypeCard({
  docType,
  label,
  hint,
  documents,
  uploading,
  disabled,
  canDelete,
  confirmBeforeDelete,
  deletingId,
  openingId,
  onFiles,
  onOpen,
  onDelete,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = ICONS[docType];
  const hasDocs = documents.length > 0;

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0 || disabled) return;
    onFiles(docType, Array.from(list));
  }

  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition-colors ${
        dragging ? "border-marigold bg-marigold/5" : "border-ink/10"
      }`}
      onDragEnter={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[docType]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/45">{hint}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {documents.map((doc) => {
          const confirming = confirmingId === doc.id;
          return (
            <div key={doc.id} className="flex items-center gap-2 rounded-lg bg-mist/60 px-2.5 py-2">
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onOpen(doc)}
                  className="block max-w-full cursor-pointer truncate text-left text-xs font-semibold text-ink hover:text-[#8a5a10]"
                >
                  {openingId === doc.id ? "Opening…" : doc.fileName}
                </button>
                <p className="font-data text-[10px] text-ink/40">{formatRelativeUpdated(doc.uploadedAt)}</p>
              </div>
              {canDelete &&
                (confirming ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(null);
                        onDelete(doc.id);
                      }}
                      className="cursor-pointer rounded-lg px-1.5 py-0.5 text-[10px] font-semibold text-ember hover:bg-ember/5"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="cursor-pointer rounded-lg px-1.5 py-0.5 text-[10px] text-ink/40 hover:bg-ink/5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => (confirmBeforeDelete ? setConfirmingId(doc.id) : onDelete(doc.id))}
                    disabled={deletingId === doc.id}
                    className="shrink-0 cursor-pointer rounded-lg p-1 text-ink/35 transition hover:bg-ember/5 hover:text-ember disabled:opacity-50"
                    aria-label={`Delete ${doc.fileName}`}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                ))}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {!disabled && (
        <>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-marigold/40 hover:bg-marigold/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {uploading ? "Uploading…" : hasDocs ? "Add another" : "Add document"}
          </button>
          <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-ink/35">
            <Lock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            Private — admins only
          </p>
        </>
      )}
    </div>
  );
}
