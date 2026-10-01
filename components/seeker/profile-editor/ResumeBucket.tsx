import { useRef } from "react";
import { FileText, Upload, X } from "lucide-react";
import {
  formatRelativeUpdated,
  isPdfResumeUrl,
  MAX_RESUMES,
  parseResume,
} from "@/lib/seeker/profile-format";

type Props = {
  resumes: string[];
  resumeUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onSetPrimary: (entry: string) => void;
  onRemove: (entry: string) => void;
};

export default function ResumeBucket({
  resumes,
  resumeUrl,
  uploading,
  onUpload,
  onSetPrimary,
  onRemove,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/55">
        Store up to {MAX_RESUMES} resumes. Pick one as default for job applications.
      </p>

      {resumes.length > 0 ? (
        <ul className="space-y-4">
          {resumes.map((entry) => {
            const parsed = parseResume(entry);
            const isPrimary = parsed.url === resumeUrl;
            return (
              <li
                key={entry}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  isPrimary ? "border-marigold/35 bg-marigold/5" : "border-ink/8 bg-mist/30"
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
                    {isPdfResumeUrl(parsed.url) ? (
                      <iframe
                        title={`Preview ${parsed.label}`}
                        src={`${parsed.url}#page=1&view=FitH&toolbar=0&navpanes=0`}
                        className="h-40 w-full"
                      />
                    ) : (
                      <div className="flex h-40 flex-col items-center justify-center gap-2 px-3 text-center">
                        <FileText className="h-8 w-8 text-marigold" aria-hidden="true" />
                        <p className="text-[11px] font-semibold text-ink/55">Word document</p>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">{parsed.label || "Resume"}</p>
                        <p className="mt-1 font-data text-xs text-ink/45">
                          Updated {formatRelativeUpdated(parsed.updatedAt)}
                        </p>
                        {isPrimary && (
                          <span className="mt-2 inline-block rounded-full bg-marigold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a10]">
                            Default for applications
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(entry)}
                        className="cursor-pointer rounded-lg p-1 text-ink/35 hover:bg-ink/5 hover:text-ember"
                        aria-label="Remove resume"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={parsed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-marigold/30"
                      >
                        Open
                      </a>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => onSetPrimary(entry)}
                          className="cursor-pointer rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-mist hover:bg-navy/90"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/20 px-6 py-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-ink/25" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-ink/55">No resume uploaded yet</p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      {resumes.length < MAX_RESUMES ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {uploading ? "Uploading..." : resumes.length ? "Add another resume" : "Upload resume"}
        </button>
      ) : (
        <p className="text-sm text-ink/45">Maximum {MAX_RESUMES} resumes reached — remove one to add another.</p>
      )}
    </div>
  );
}
