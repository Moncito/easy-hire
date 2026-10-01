import { useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { formatRelativeUpdated } from "@/lib/seeker/profile-format";
import { docTypeLabel, fileKind, type IdentityDocument } from "./shared";

type Props = {
  documents: IdentityDocument[];
  canDelete: boolean;
  confirmBeforeDelete: boolean;
  deletingId: string | null;
  openingId: string | null;
  onOpen: (doc: IdentityDocument) => void;
  onDelete: (id: string) => void;
  label?: string;
};

export default function DocumentList({
  documents,
  canDelete,
  confirmBeforeDelete,
  deletingId,
  openingId,
  onOpen,
  onDelete,
  label,
}: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (documents.length === 0) return null;

  return (
    <div className="space-y-2">
      {label && <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">{label}</p>}
      <ul className="space-y-2">
        {documents.map((doc) => {
          const Icon = fileKind(doc.fileName) === "image" ? ImageIcon : FileText;
          const confirming = confirmingId === doc.id;
          return (
            <li key={doc.id} className="flex items-center gap-3 rounded-xl bg-mist/60 px-3 py-2.5">
              <Icon className="h-4 w-4 shrink-0 text-marigold" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onOpen(doc)}
                  className="block max-w-full cursor-pointer truncate text-left text-sm font-semibold text-ink hover:text-[#8a5a10]"
                >
                  {openingId === doc.id ? "Opening…" : doc.fileName}
                </button>
                <p className="font-data text-[11px] text-ink/40">
                  {docTypeLabel(doc.docType)} · {formatRelativeUpdated(doc.uploadedAt)}
                </p>
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
                      className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-ember hover:bg-ember/5"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="cursor-pointer rounded-lg px-2 py-1 text-xs text-ink/40 hover:bg-ink/5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => (confirmBeforeDelete ? setConfirmingId(doc.id) : onDelete(doc.id))}
                    disabled={deletingId === doc.id}
                    className="shrink-0 cursor-pointer rounded-lg p-1.5 text-ink/35 transition hover:bg-ember/5 hover:text-ember disabled:opacity-50"
                    aria-label={`Delete ${doc.fileName}`}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
