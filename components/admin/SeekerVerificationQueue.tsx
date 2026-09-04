"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Mail, Clock, ExternalLink, FileText, User } from "lucide-react";

type PendingSeekerDocument = {
  id: string;
  fileUrl: string;
  fileName: string;
  docType: string;
  uploadedAt: string;
};

type PendingSeeker = {
  id: string;
  fullName: string;
  verificationScore: number;
  updatedAt: string;
  user: { email: string };
  identityDocuments: PendingSeekerDocument[];
};

type Props = {
  initialSeekers: PendingSeeker[];
};

function docTypeLabel(docType: string) {
  return docType.replace(/_/g, " ");
}

export default function SeekerVerificationQueue({ initialSeekers }: Props) {
  const router = useRouter();
  const [seekers, setSeekers] = useState(initialSeekers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  async function review(seekerId: string, action: "approve" | "reject", reason?: string) {
    setError("");
    setLoadingId(seekerId);

    const res = await fetch(`/api/admin/seekers/verifications/${seekerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });

    const result = await res.json();
    setLoadingId(null);

    if (!res.ok) {
      setError(result.error || "Action failed");
      return;
    }

    setSeekers((prev) => prev.filter((s) => s.id !== seekerId));
    setRejectingId(null);
    setRejectReason("");
    router.refresh();
  }

  if (seekers.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-white p-12 text-center shadow-xs">
        <Check className="mx-auto mb-3 h-8 w-8 text-teal" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-ink">All caught up</h2>
        <p className="mt-1 text-sm text-ink/50">No VAs are waiting for identity verification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</div>
      )}

      <div className="rounded-xl border border-navy/10 bg-navy/5 px-4 py-3 text-sm text-ink/70">
        <strong className="text-ink">Identity confidence, not skill:</strong> approving here only confirms the
        person behind the account is real and reachable. It never reflects work quality or reliability.
      </div>

      {seekers.map((seeker) => {
        const initials = seeker.fullName
          .split(" ")
          .filter(Boolean)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <article
            key={seeker.id}
            className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-marigold/10 font-display text-lg font-bold text-[#8a5a10]">
                    {initials || <User className="h-6 w-6" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-ink">{seeker.fullName || "Unnamed VA"}</h2>
                      <span className="rounded-full bg-marigold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a10]">
                        Pending review
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/55">
                      Current identity confidence:{" "}
                      <span className="font-data font-semibold text-ink">{seeker.verificationScore}/100</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink/45">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    {seeker.user.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Updated {new Date(seeker.updatedAt).toLocaleString()}
                  </span>
                </div>

                {seeker.identityDocuments.length > 0 ? (
                  <div className="mt-4 rounded-xl bg-mist/80 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/45">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      Identity documents ({seeker.identityDocuments.length})
                    </p>
                    <ul className="space-y-1.5">
                      {seeker.identityDocuments.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
                          >
                            {doc.fileName}
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-ink/40">
                            {docTypeLabel(doc.docType)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-ink/40">No identity documents uploaded.</p>
                )}

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link
                    href={`/seekers/${seeker.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-ink/55 hover:text-teal"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Preview public profile
                  </Link>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                <button
                  type="button"
                  disabled={loadingId === seeker.id}
                  onClick={() => review(seeker.id, "approve")}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal/95 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Approve identity
                </button>
                <button
                  type="button"
                  disabled={loadingId === seeker.id}
                  onClick={() => setRejectingId(seeker.id)}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/4 disabled:opacity-60"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Reject
                </button>
              </div>
            </div>

            {rejectingId === seeker.id && (
              <div className="mt-4 border-t border-ink/5 pt-4">
                <label htmlFor={`reason-${seeker.id}`} className="mb-2 block text-sm font-medium text-ink">
                  Rejection reason
                </label>
                <textarea
                  id={`reason-${seeker.id}`}
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what the VA needs to fix..."
                  aria-describedby={`reason-${seeker.id}-hint`}
                  className="w-full resize-y rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
                <p id={`reason-${seeker.id}-hint`} className="mt-1.5 text-xs text-ink/40">
                  Optional — if left blank, the VA sees a generic &ldquo;please review your documents&rdquo; message.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectReason("");
                    }}
                    className="cursor-pointer rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === seeker.id}
                    onClick={() => review(seeker.id, "reject", rejectReason)}
                    className="cursor-pointer rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Confirm rejection
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
