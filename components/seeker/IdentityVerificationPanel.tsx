"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Clock, FilePlus2, Loader2, Shield, ShieldCheck } from "lucide-react";
import VerificationBadge from "@/components/seeker/VerificationBadge";
import { MAX_IDENTITY_DOCUMENTS, verificationTier, type VerificationScoreBreakdown } from "@/lib/seeker/verification-score";
import { parseJsonBody } from "@/lib/client/fetch-json";
import type { ProfileBucketId } from "@/components/seeker/profile-buckets";
import StepRail from "@/components/seeker/identity-verification/StepRail";
import ScoreLedger from "@/components/seeker/identity-verification/ScoreLedger";
import DocumentList from "@/components/seeker/identity-verification/DocumentList";
import DocTypeCard from "@/components/seeker/identity-verification/DocTypeCard";
import {
  DOC_TYPE_OPTIONS,
  uploadErrorMessage,
  type DocType,
  type IdentityDocument,
} from "@/components/seeker/identity-verification/shared";

const CARD_DOC_TYPES: DocType[] = ["GOVERNMENT_ID", "PROOF_OF_ADDRESS", "SELFIE_WITH_ID"];

/**
 * Phase 4.2 — the seeker's own identity-verification management surface.
 * Mounted on app/seeker/profile/page.tsx (see that file's comment for why),
 * mirroring the employer-side placement of VerificationDocumentsPanel inside
 * CompanyProfileEditor.tsx rather than the settings page.
 *
 * Redesigned around a state machine (not-started / ready / in-review /
 * in-review-no-docs / verified / rejected) instead of showing every block
 * regardless of where the seeker actually is — see docs/seeker-refactor-plan.md
 * for the research spec this implements.
 */

export type { IdentityDocument };

type IdVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type Props = {
  status: IdVerificationStatus;
  rejectionReason: string | null;
  score: number;
  breakdown: VerificationScoreBreakdown;
  idVerifiedAt: string | null;
  profileBucketsCompleted: number;
  profileBucketsTotal: number;
  firstIncompleteBucket: ProfileBucketId | null;
  publicProfileHref: string;
  initialDocuments: IdentityDocument[];
};

type UiState = "not_started" | "ready" | "in_review" | "in_review_no_docs" | "verified" | "rejected";

async function uploadIdentityDocFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload/identity-doc", { method: "POST", body });
  const data = (await parseJsonBody(res)) as { error?: string; url?: string; fileName?: string };
  return { ok: res.ok, status: res.status, data };
}

export default function IdentityVerificationPanel({
  status,
  rejectionReason,
  score,
  breakdown,
  idVerifiedAt,
  profileBucketsCompleted,
  profileBucketsTotal,
  firstIncompleteBucket,
  publicProfileHref,
  initialDocuments,
}: Props) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploadingDocType, setUploadingDocType] = useState<DocType | null>(null);
  const [fileError, setFileError] = useState("");
  const [actionError, setActionError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [localStatus, setLocalStatus] = useState<IdVerificationStatus>(status);
  // Tracks the last `status` prop seen, so a change coming from outside this
  // component (e.g. an admin approves while this page is open and something
  // else triggers a refresh) resets localStatus too — not just this
  // component's own optimistic updates. Adjusting state during render
  // instead of in an effect avoids an extra render pass.
  const [syncedStatus, setSyncedStatus] = useState(status);
  if (status !== syncedStatus) {
    setSyncedStatus(status);
    setLocalStatus(status);
  }

  const canUpload = localStatus !== "APPROVED";
  const atCap = documents.length >= MAX_IDENTITY_DOCUMENTS;
  const tier = verificationTier(score);

  const uiState: UiState =
    localStatus === "APPROVED"
      ? "verified"
      : localStatus === "PENDING"
        ? documents.length === 0
          ? "in_review_no_docs"
          : "in_review"
        : localStatus === "REJECTED"
          ? "rejected"
          : documents.length > 0
            ? "ready"
            : "not_started";

  async function uploadOne(file: File, docType: DocType) {
    setAnnouncement(`Uploading ${file.name}…`);
    setUploadingDocType(docType);
    try {
      const upload = await uploadIdentityDocFile(file);
      if (!upload.ok) {
        throw new Error(uploadErrorMessage(upload.status, upload.data.error || "Upload failed"));
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
        throw new Error(uploadErrorMessage(res.status, (created as { error?: string }).error || "Could not save document"));
      }

      setDocuments((prev) => [created as IdentityDocument, ...prev]);
      if (localStatus === "REJECTED") {
        // Mirrors createIdentityDocument's wasRejected auto-resubmit.
        setLocalStatus("PENDING");
        setAnnouncement("Document uploaded. Your rejected verification was automatically resubmitted for review.");
      } else {
        setAnnouncement(
          localStatus === null
            ? "Document uploaded. Click Request review below to submit it for admin review."
            : "Document uploaded."
        );
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setFileError(msg);
      setAnnouncement(msg);
      throw err;
    } finally {
      setUploadingDocType(null);
    }
  }

  async function handleFiles(docType: DocType, files: File[]) {
    setFileError("");
    const room = MAX_IDENTITY_DOCUMENTS - documents.length;
    for (const file of files.slice(0, Math.max(room, 0))) {
      try {
        // Sequential on purpose: the API enforces the 3-document cap
        // per-request, so firing all files at once could race past it.
        await uploadOne(file, docType);
      } catch {
        break;
      }
    }
  }

  async function handleDelete(id: string) {
    setActionError("");
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
      setActionError(msg);
      setAnnouncement(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRequestReview() {
    setActionError("");
    setRequesting(true);
    try {
      const res = await fetch("/api/seeker/verification/request-review", { method: "POST" });
      const result = await parseJsonBody(res);
      if (!res.ok) {
        throw new Error((result as { error?: string }).error || "Could not request review");
      }
      setLocalStatus("PENDING");
      setAnnouncement("Review requested. We'll notify you here once it's been reviewed.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setActionError(msg);
      setAnnouncement(msg);
    } finally {
      setRequesting(false);
    }
  }

  /** Documents are signed with a 5-minute TTL at render time — re-fetch a fresh URL before opening one that may have been sitting on the page longer than that. */
  async function handleOpen(doc: IdentityDocument) {
    setOpeningId(doc.id);
    try {
      const res = await fetch("/api/seeker/verification");
      const list = (await parseJsonBody(res)) as IdentityDocument[];
      const fresh = list.find((d) => d.id === doc.id);
      window.open(fresh?.fileUrl || doc.fileUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningId(null);
    }
  }

  const eyebrowColor = uiState === "rejected" ? "bg-ember" : "bg-marigold";
  const ledgerExpandedByDefault = uiState === "in_review" || uiState === "in_review_no_docs" || uiState === "verified";
  const confirmBeforeDelete = uiState === "in_review" || uiState === "in_review_no_docs";

  return (
    <section
      id="identity-verification"
      className="animate-fade-in scroll-mt-28 relative overflow-hidden rounded-[28px] bg-[#FDFBF6] p-6 lg:p-11"
    >
      {/* Soft marigold-tinted wash + a faint teal accent blob — a
          deliberately distinct "trust moment" treatment, per the approved
          profile-redesign mockup. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle at 8% 0%, rgba(242,169,59,0.12), transparent 55%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-[220px] w-[220px]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(31,128,115,0.08), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative space-y-8">
        <div>
          <div className={`mb-3 h-0.5 w-10 rounded-full transition-colors ${eyebrowColor}`} />
          <StateHero uiState={uiState} documentsCount={documents.length} idVerifiedAt={idVerifiedAt} publicProfileHref={publicProfileHref} />
        </div>

        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        {(uiState === "not_started" || uiState === "ready") && <StepRail documentsCount={documents.length} />}

        {uiState === "rejected" && rejectionReason && <RejectionReason reason={rejectionReason} />}

        {actionError && (
          <p role="alert" className="rounded-xl border border-ember/15 bg-ember/5 px-4 py-3 text-sm text-ember">
            {actionError}
          </p>
        )}

        <ScoreLedger
          score={score}
          breakdown={breakdown}
          status={localStatus}
          profileBucketsCompleted={profileBucketsCompleted}
          profileBucketsTotal={profileBucketsTotal}
          firstIncompleteBucket={firstIncompleteBucket}
          defaultExpanded={ledgerExpandedByDefault}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {CARD_DOC_TYPES.map((type) => {
            const opt = DOC_TYPE_OPTIONS.find((o) => o.value === type)!;
            return (
              <DocTypeCard
                key={type}
                docType={type}
                label={opt.label}
                hint={opt.hint}
                documents={documents.filter((d) => d.docType === type)}
                uploading={uploadingDocType === type}
                disabled={!canUpload || atCap}
                canDelete={canUpload}
                confirmBeforeDelete={confirmBeforeDelete}
                deletingId={deletingId}
                openingId={openingId}
                onFiles={handleFiles}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            );
          })}
        </div>

        {atCap && (
          <p className="text-center text-xs text-ink/45">
            {MAX_IDENTITY_DOCUMENTS} of {MAX_IDENTITY_DOCUMENTS} documents uploaded — remove one above to add another.
          </p>
        )}

        {fileError && (
          <p role="alert" className="rounded-xl border border-ember/15 bg-ember/5 px-3 py-2 text-xs text-ember">
            {fileError}
          </p>
        )}

        <DocumentList
          documents={documents.filter((d) => !CARD_DOC_TYPES.includes(d.docType as DocType))}
          canDelete={canUpload}
          confirmBeforeDelete={confirmBeforeDelete}
          deletingId={deletingId}
          openingId={openingId}
          onOpen={handleOpen}
          onDelete={handleDelete}
          label="Other documents"
        />

        {canUpload && !atCap && (
          <OtherDocUpload uploading={uploadingDocType === "OTHER"} onFiles={(files) => handleFiles("OTHER", files)} />
        )}

        {canUpload && (
          <div className="space-y-3">
            {uiState === "ready" && (
              <div>
                <button
                  type="button"
                  disabled={requesting}
                  onClick={() => void handleRequestReview()}
                  className="w-full cursor-pointer rounded-xl bg-marigold px-4 py-3.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-marigold/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {requesting ? "Requesting…" : "Request review"}
                </button>
                <p className="mt-2 text-center text-xs text-ink/45">
                  Reviewed within 24 hours · you&apos;ll get a notification
                </p>
              </div>
            )}

            {uiState === "not_started" && (
              <div
                aria-disabled="true"
                className="w-full cursor-not-allowed rounded-xl border border-dashed border-ink/15 bg-ink/[0.03] px-4 py-3 text-center text-sm font-medium text-ink/40"
              >
                Request review — upload a document first
              </div>
            )}

            {uiState === "rejected" && documents.length > 0 && (
              <button
                type="button"
                disabled={requesting}
                onClick={() => void handleRequestReview()}
                className="w-full cursor-pointer text-center text-xs font-medium text-ink/55 underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
              >
                {requesting ? "Resubmitting…" : "Resubmit the same documents"}
              </button>
            )}
          </div>
        )}

        {(uiState === "in_review" || uiState === "in_review_no_docs") && (
          <div className="flex items-center gap-2 rounded-xl border border-ink/8 bg-white/60 px-4 py-3 text-sm text-ink/50">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            Nothing to do right now
          </div>
        )}

        <div className="border-t border-ink/[0.06] pt-6">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink/40">What employers see</p>
          <VerificationBadge score={score} tier={tier} idVerifiedAt={idVerifiedAt} size="md" accent="seeker" />
        </div>
      </div>
    </section>
  );
}

function StateHero({
  uiState,
  documentsCount,
  idVerifiedAt,
  publicProfileHref,
}: {
  uiState: UiState;
  documentsCount: number;
  idVerifiedAt: string | null;
  publicProfileHref: string;
}) {
  if (uiState === "verified") {
    const verifiedDate = idVerifiedAt
      ? new Date(idVerifiedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : null;
    return (
      <div>
        <StatusChip icon={ShieldCheck} label="Verified" tone="marigold" />
        <h2 className="mt-3 font-display text-xl font-bold text-ink lg:text-[26px]">Identity verified</h2>
        <p className="mt-1.5 text-sm text-ink/55">
          {verifiedDate ? (
            <>
              Approved <span className="font-data">{verifiedDate}</span>. Documents are locked once verified.
            </>
          ) : (
            "Documents are locked once verified."
          )}
        </p>
        <a
          href={publicProfileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#8a5a10] hover:underline"
        >
          View your public profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    );
  }

  if (uiState === "rejected") {
    return (
      <div>
        <StatusChip icon={AlertCircle} label="Not approved" tone="ember" />
        <h2 className="mt-3 font-display text-xl font-bold text-ink lg:text-[26px]">Identity verification</h2>
      </div>
    );
  }

  if (uiState === "in_review_no_docs") {
    return (
      <div>
        <StatusChip icon={Clock} label="In review" tone="navy" />
        <h2 className="mt-3 font-display text-xl font-bold text-ink lg:text-[26px]">Your review has no documents</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/55">
          You removed every document from this review, so there&apos;s nothing for an admin to check. Upload one now —
          it&apos;ll be attached to the same pending review.
        </p>
      </div>
    );
  }

  if (uiState === "in_review") {
    return (
      <div>
        <StatusChip icon={Clock} label="In review" tone="navy" />
        <h2 className="mt-3 font-display text-xl font-bold text-ink lg:text-[26px]">Your ID is with our team</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/55">
          An admin usually checks within 24 hours. You can still add a supporting document below — it&apos;ll be
          included in the same review.
        </p>
      </div>
    );
  }

  if (uiState === "ready") {
    return (
      <div>
        <StatusChip icon={Shield} label="Ready to submit" tone="marigold" />
        <h2 className="mt-3 font-display text-xl font-bold text-ink lg:text-[26px]">One more step</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/55">
          You&apos;ve uploaded {documentsCount} document{documentsCount === 1 ? "" : "s"} — nothing happens until you
          request a review.
        </p>
      </div>
    );
  }

  // not_started
  return (
    <div>
      <StatusChip icon={Shield} label="Not started" tone="neutral" />
      <h2 className="mt-3 font-display text-xl font-bold text-ink lg:text-[26px]">Verify your identity</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-ink/55">
        Employers filter talent search by verified identity. It takes about 2 minutes. Only EasyHire admins see your
        documents — stored privately, never shown on your profile.
      </p>
    </div>
  );
}

function StatusChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Shield;
  label: string;
  tone: "marigold" | "navy" | "ember" | "neutral";
}) {
  const toneClass =
    tone === "marigold"
      ? "border-marigold/30 bg-marigold/10 text-[#8a5a10]"
      : tone === "navy"
        ? "border-navy/20 bg-navy/8 text-navy"
        : tone === "ember"
          ? "border-ember/25 bg-ember/8 text-ember"
          : "border-ink/10 bg-ink/5 text-ink/50";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

function OtherDocUpload({ uploading, onFiles }: { uploading: boolean; onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-ink/15 px-3 py-2 text-xs font-semibold text-ink/55 transition hover:border-marigold/40 hover:bg-marigold/5 hover:text-ink disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {uploading ? "Uploading…" : "Add another supporting document"}
      </button>
    </div>
  );
}

function RejectionReason({ reason }: { reason: string }) {
  return (
    <div className="rounded-2xl border border-ember/20 border-l-4 border-l-ember bg-white px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ember/70">Why it wasn&apos;t approved</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{reason}</p>
      <ol className="mt-3 space-y-1 text-xs leading-relaxed text-ink/55">
        <li>1. Re-take the photo in good light with all four corners visible.</li>
        <li>2. Make sure the name matches your profile name.</li>
        <li>3. Upload below and we&apos;ll review it again automatically.</li>
      </ol>
    </div>
  );
}
