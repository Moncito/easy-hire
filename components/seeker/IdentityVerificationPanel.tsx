"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Clock, FileText, Loader2, Trash2, Upload } from "lucide-react";
import VerificationBadge, { VERIFICATION_QUALIFIER } from "@/components/seeker/VerificationBadge";
import { VERIFICATION_SCORE_WEIGHTS, verificationTier } from "@/lib/seeker/verification-score";
import { MAX_IDENTITY_DOCUMENTS } from "@/lib/seeker/identity-verification";
import { parseJsonBody } from "@/lib/client/fetch-json";

/**
 * Phase 4.2 — the seeker's own identity-verification management surface.
 * Mounted on app/seeker/profile/page.tsx (see that file's comment for why),
 * mirroring the employer-side placement of VerificationDocumentsPanel inside
 * CompanyProfileEditor.tsx rather than the settings page.
 */

export type IdentityDocument = {
  id: string;
  fileUrl: string;
  fileName: string;
  docType: string;
  uploadedAt: string;
};

type IdVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type Props = {
  status: IdVerificationStatus;
  rejectionReason: string | null;
  score: number;
  idVerifiedAt: string | null;
  /** Profile-completion bucket state already computed by app/seeker/profile/page.tsx — same buckets `getSeekerProfileCompletion` uses server-side, so this matches the persisted score's "profile" factor exactly. */
  profileBucketsCompleted: number;
  profileBucketsTotal: number;
  initialDocuments: IdentityDocument[];
};

const DOC_TYPE_OPTIONS = [
  { value: "GOVERNMENT_ID", label: "Government-issued ID" },
  { value: "PROOF_OF_ADDRESS", label: "Proof of address" },
  { value: "SELFIE_WITH_ID", label: "Selfie holding your ID" },
  { value: "OTHER", label: "Other document" },
] as const;

function docTypeLabel(docType: string) {
  return DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType;
}

async function uploadIdentityDocFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload/identity-doc", { method: "POST", body });
  const data = (await parseJsonBody(res)) as { error?: string; url?: string; fileName?: string };
  return { ok: res.ok, data };
}

export default function IdentityVerificationPanel({
  status,
  rejectionReason,
  score,
  idVerifiedAt,
  profileBucketsCompleted,
  profileBucketsTotal,
  initialDocuments,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [docType, setDocType] = useState<(typeof DOC_TYPE_OPTIONS)[number]["value"]>("GOVERNMENT_ID");
  const [uploading, setUploading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [localStatus, setLocalStatus] = useState<IdVerificationStatus>(status);

  const canUpload = localStatus !== "APPROVED";
  const atCap = documents.length >= MAX_IDENTITY_DOCUMENTS;
  const tier = verificationTier(score);

  // Exact-match factors (computed the same way the backend does), so the
  // combined third row below is derived by subtraction from the persisted
  // total — no guessing. See the report to the parent agent: emailVerifiedAt
  // and confirmedHireCount aren't exposed to the seeker's own page today, so
  // the email + confirmed-hires factors can only be shown combined here.
  const identityEarned = localStatus === "APPROVED" ? VERIFICATION_SCORE_WEIGHTS.identity : 0;
  const profilePercent =
    profileBucketsTotal > 0 ? Math.round((profileBucketsCompleted / profileBucketsTotal) * 100) : 0;
  const profileEarned = Math.round((profilePercent / 100) * VERIFICATION_SCORE_WEIGHTS.profile);
  const trustSignalsMax = VERIFICATION_SCORE_WEIGHTS.email + VERIFICATION_SCORE_WEIGHTS.history;
  const trustSignalsEarned = Math.max(0, Math.min(trustSignalsMax, score - identityEarned - profileEarned));

  async function handleUpload(file: File) {
    setError("");
    setAnnouncement("Uploading document…");
    setUploading(true);

    try {
      const upload = await uploadIdentityDocFile(file);
      if (!upload.ok) {
        throw new Error(upload.data.error || "Upload failed");
      }

      const res = await fetch("/api/seeker/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: upload.data.url,
          fileName: upload.data.fileName || file.name,
          docType,
        }),
      });
      const created = await parseJsonBody(res);
      if (!res.ok) {
        throw new Error((created as { error?: string }).error || "Could not save document");
      }

      setDocuments((prev) => [created as IdentityDocument, ...prev]);
      if (localStatus === "REJECTED") {
        // Mirrors createIdentityDocument's wasRejected auto-resubmit.
        setLocalStatus("PENDING");
        setAnnouncement("Document uploaded. Your rejected verification was automatically resubmitted for review.");
      } else {
        setAnnouncement(
          localStatus === null
            ? "Document uploaded. Click “Request review” below to submit it for admin review."
            : "Document uploaded."
        );
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      setAnnouncement(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setDeletingId(id);
    try {
      const res = await fetch(`/api/seeker/verification/${id}`, { method: "DELETE" });
      const result = await parseJsonBody(res);
      if (!res.ok) {
        throw new Error((result as { error?: string }).error || "Could not delete document");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setAnnouncement("Document deleted.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setError(msg);
      setAnnouncement(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRequestReview() {
    setError("");
    setRequesting(true);
    try {
      const res = await fetch("/api/seeker/verification/request-review", { method: "POST" });
      const result = await parseJsonBody(res);
      if (!res.ok) {
        throw new Error((result as { error?: string }).error || "Could not request review");
      }
      setLocalStatus("PENDING");
      setAnnouncement("Review requested. We'll email you once it's been checked.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      setAnnouncement(msg);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink/8 bg-white p-6 lg:p-7">
      <div className="mb-1 h-0.5 w-10 rounded-full bg-marigold" />
      <div className="mb-5 mt-3">
        <h2 className="font-display text-xl font-bold text-ink">Identity verification</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/55">{VERIFICATION_QUALIFIER} Employers see your
          badge on your public profile and in talent search.</p>
      </div>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <VerificationBadge score={score} tier={tier} idVerifiedAt={idVerifiedAt} size="md" accent="seeker" />
      </div>

      {localStatus === "APPROVED" && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-marigold/10 px-4 py-3 text-[#8a5a10]">
            <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span className="text-sm font-semibold">Identity verified</span>
          </div>
          <p className="text-xs leading-relaxed text-ink/50">
            Your government ID was approved. Documents can&apos;t be removed once verified.
          </p>
        </div>
      )}

      {localStatus === "PENDING" && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-navy/5 px-4 py-3 text-navy">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold">Review pending</span>
          </div>
          <p className="text-xs leading-relaxed text-ink/50">
            An admin is checking your documents — usually within 24 hours. You can still add more documents below.
          </p>
        </div>
      )}

      {localStatus === "REJECTED" && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-ember/5 px-4 py-3 text-ember">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold">Verification not approved</span>
          </div>
          {rejectionReason && (
            <p className="rounded-xl border border-ember/15 bg-white px-4 py-3 text-sm leading-relaxed text-ink/70">
              {rejectionReason}
            </p>
          )}
          <p className="text-xs leading-relaxed text-ink/50">
            Upload a clearer document below — re-uploading automatically resubmits you for review.
          </p>
        </div>
      )}

      {localStatus === null && documents.length === 0 && (
        <div className="mb-5 rounded-xl border border-dashed border-ink/15 bg-mist/40 px-4 py-3">
          <p className="text-sm font-semibold text-ink/70">Not submitted yet</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/50">
            Upload a government ID below, then click &ldquo;Request review&rdquo; to send it to an admin. Uploading
            alone does not submit it for review.
          </p>
        </div>
      )}

      {localStatus === null && documents.length > 0 && (
        <div className="mb-5 rounded-xl border border-marigold/30 bg-marigold/8 px-4 py-3">
          <p className="text-sm font-semibold text-[#8a5a10]">Ready to submit</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/60">
            You&apos;ve uploaded {documents.length} document{documents.length === 1 ? "" : "s"} but haven&apos;t
            requested a review yet — nothing happens until you do.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-ember/15 bg-ember/5 px-4 py-3 text-sm text-ember">
          {error}
        </p>
      )}

      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/45">
          How your score is calculated
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <BreakdownRow
            label="Identity document"
            earned={identityEarned}
            max={VERIFICATION_SCORE_WEIGHTS.identity}
            hint={localStatus === "APPROVED" ? "Approved" : "Awaiting an approved ID"}
          />
          <BreakdownRow
            label="Profile completeness"
            earned={profileEarned}
            max={VERIFICATION_SCORE_WEIGHTS.profile}
            hint={`${profileBucketsCompleted}/${profileBucketsTotal} sections filled`}
          />
          <BreakdownRow
            label="Email & hire history"
            earned={trustSignalsEarned}
            max={trustSignalsMax}
            hint="Verified email + confirmed hires, tracked automatically"
          />
        </div>
      </div>

      {documents.length > 0 && (
        <ul className="mb-5 space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2 rounded-xl bg-mist/60 px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-marigold" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-semibold text-ink hover:text-[#8a5a10]"
                >
                  {doc.fileName}
                </a>
                <p className="text-[11px] text-ink/40">{docTypeLabel(doc.docType)}</p>
              </div>
              {canUpload && (
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="cursor-pointer rounded-lg p-1.5 text-ink/35 transition hover:bg-ember/5 hover:text-ember disabled:opacity-50"
                  aria-label={`Delete ${doc.fileName}`}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <div className="space-y-3">
          <div>
            <label htmlFor="identity-doc-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Document type
            </label>
            <select
              id="identity-doc-type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as (typeof DOC_TYPE_OPTIONS)[number]["value"])}
              className="w-full cursor-pointer rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20"
            >
              {DOC_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor="identity-doc-file" className="sr-only">
            Identity document file
          </label>
          <input
            ref={fileInputRef}
            id="identity-doc-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            aria-describedby="identity-doc-help"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />

          <button
            type="button"
            disabled={uploading || atCap}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 bg-white px-4 py-3 text-sm font-semibold text-ink/70 transition hover:border-marigold/40 hover:bg-marigold/5 hover:text-[#8a5a10] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden="true" />
                {atCap ? `Document limit reached (${MAX_IDENTITY_DOCUMENTS})` : "Upload document"}
              </>
            )}
          </button>
          <p id="identity-doc-help" className="text-[11px] leading-relaxed text-ink/40">
            PDF, JPG, or PNG · up to {MAX_IDENTITY_DOCUMENTS} files
          </p>

          {(localStatus === null || localStatus === "REJECTED") && (
            <button
              type="button"
              disabled={requesting || documents.length === 0}
              onClick={() => void handleRequestReview()}
              className="w-full cursor-pointer rounded-xl bg-marigold px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-marigold/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {requesting ? "Requesting…" : "Request review"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function BreakdownRow({
  label,
  earned,
  max,
  hint,
}: {
  label: string;
  earned: number;
  max: number;
  hint: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((earned / max) * 100)) : 0;
  return (
    <div className="rounded-xl border border-ink/8 bg-mist/40 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p className="font-data text-xs font-semibold text-ink/70">
          {earned}/{max}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8">
        <div className="h-full rounded-full bg-marigold transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink/45">{hint}</p>
    </div>
  );
}
