"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createVerificationDocument,
  deleteVerificationDocument,
  requestVerificationReview,
} from "@/lib/client/company";
import { uploadVerificationDoc } from "@/lib/client/uploads";
import {
  AlertCircle,
  Check,
  Clock,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

export type VerificationDoc = {
  id: string;
  fileUrl: string;
  fileName: string;
  docType: string;
  uploadedAt: string;
};

type VerificationStatus = "pending" | "verified" | "rejected";

type Props = {
  status: VerificationStatus;
  rejectionReason: string | null;
  initialDocuments: VerificationDoc[];
};

const DOC_TYPE_OPTIONS = [
  { value: "BUSINESS_REGISTRATION", label: "Business registration (DTI / SEC)" },
  { value: "BUSINESS_PERMIT", label: "Business permit" },
  { value: "OTHER", label: "Other proof" },
] as const;

function docTypeLabel(docType: string) {
  return DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType;
}

export default function VerificationDocumentsPanel({
  status,
  rejectionReason,
  initialDocuments,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [docType, setDocType] = useState<(typeof DOC_TYPE_OPTIONS)[number]["value"]>(
    "BUSINESS_REGISTRATION"
  );
  const [uploading, setUploading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [localStatus, setLocalStatus] = useState(status);

  const canEdit = localStatus === "pending" || localStatus === "rejected";
  const atCap = documents.length >= 5;

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);

    try {
      const upload = await uploadVerificationDoc(file);
      if (!upload.ok) {
        throw new Error(upload.data.error || "Upload failed");
      }

      const create = await createVerificationDocument({
        fileUrl: upload.data.url!,
        fileName: upload.data.fileName || file.name,
        docType,
      });
      if (!create.ok) {
        throw new Error(create.error || "Could not save document");
      }

      setDocuments((prev) => [create.data as VerificationDoc, ...prev]);
      if (localStatus === "rejected") {
        setLocalStatus("pending");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setDeletingId(id);
    try {
      const result = await deleteVerificationDocument(id);
      if (!result.ok) {
        throw new Error(result.error || "Could not delete document");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRequestReview() {
    setError("");
    setRequesting(true);
    try {
      const result = await requestVerificationReview();
      if (!result.ok) {
        throw new Error(result.error || "Could not request review");
      }
      setLocalStatus("pending");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <section className="border-t border-ink/5 pt-6">
      <h3 className="mb-4 text-sm font-bold tracking-tight text-ink">Verification</h3>

      {localStatus === "verified" && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-teal/5 p-3 text-teal">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            <span className="text-xs font-semibold">Verified Company</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink/50">
            Your profile is validated. Approved jobs can appear on the public board.
          </p>
        </div>
      )}

      {localStatus === "pending" && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-navy/5 p-3 text-navy">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold">Review Pending</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink/50">
            Upload registration or permit documents to speed up review. Usually within 24 hours.
          </p>
        </div>
      )}

      {localStatus === "rejected" && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-ember/5 p-3 text-ember">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold">Verification Failed</span>
          </div>
          {rejectionReason && (
            <p className="rounded-xl border border-ember/10 bg-white p-3 text-[11px] leading-relaxed text-ink/70">
              {rejectionReason}
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-ink/50">
            Update your profile or upload clearer documents, then request another review.
          </p>
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-xl border border-ember/15 bg-ember/5 px-3 py-2 text-[11px] text-ember">
          {error}
        </p>
      )}

      {documents.length > 0 && (
        <ul className="mb-4 space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-2 rounded-lg bg-ink/[0.02] p-2.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs font-semibold text-ink hover:text-teal"
                >
                  {doc.fileName}
                </a>
                <p className="text-[10px] text-ink/40">{docTypeLabel(doc.docType)}</p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="rounded-lg p-1.5 text-ink/35 transition hover:bg-ember/5 hover:text-ember disabled:opacity-50"
                  aria-label={`Delete ${doc.fileName}`}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="verification-doc-type"
              className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink/45"
            >
              Document type
            </label>
            <select
              id="verification-doc-type"
              value={docType}
              onChange={(e) =>
                setDocType(e.target.value as (typeof DOC_TYPE_OPTIONS)[number]["value"])
              }
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-teal"
            >
              {DOC_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />

          <button
            type="button"
            disabled={uploading || atCap}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 bg-white px-3 py-2.5 text-xs font-semibold text-ink/70 transition hover:border-teal/40 hover:bg-teal/5 hover:text-teal disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                {atCap ? "Document limit reached (5)" : "Upload document"}
              </>
            )}
          </button>
          <p className="text-[10px] leading-relaxed text-ink/40">
            PDF, JPG, or PNG · max 5MB · up to 5 files
          </p>

          {localStatus === "rejected" && (
            <button
              type="button"
              disabled={requesting}
              onClick={() => void handleRequestReview()}
              className="w-full cursor-pointer rounded-xl bg-teal px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal/95 disabled:opacity-60"
            >
              {requesting ? "Requesting…" : "Request re-review"}
            </button>
          )}
        </div>
      )}

      {localStatus === "verified" && documents.length === 0 && (
        <p className="text-[11px] text-ink/40">No documents on file.</p>
      )}
    </section>
  );
}
