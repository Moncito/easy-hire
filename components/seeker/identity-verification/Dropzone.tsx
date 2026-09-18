import { useRef, useState } from "react";
import { FilePlus2, Loader2, Upload } from "lucide-react";
import { MAX_IDENTITY_DOCUMENTS } from "@/lib/seeker/verification-score";
import { DOC_TYPE_OPTIONS, type DocType } from "./shared";

type Props = {
  docType: DocType;
  onDocTypeChange: (v: DocType) => void;
  uploading: boolean;
  atCap: boolean;
  slotsLeft: number;
  onFiles: (files: File[]) => void;
  error: string;
};

export default function Dropzone({ docType, onDocTypeChange, uploading, atCap, slotsLeft, onFiles, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (atCap) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-mist/50 px-4 py-3.5 text-center text-sm text-ink/55">
        {MAX_IDENTITY_DOCUMENTS} of {MAX_IDENTITY_DOCUMENTS} documents uploaded — remove one below to add another.
      </div>
    );
  }

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list).slice(0, slotsLeft));
  }

  const activeHint = DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.hint;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Document type">
        {DOC_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onDocTypeChange(opt.value)}
            aria-pressed={docType === opt.value}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              docType === opt.value
                ? "border-marigold bg-marigold text-ink"
                : "border-ink/12 bg-white text-ink/60 hover:border-marigold/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {activeHint && <p className="text-[11px] text-ink/40">{activeHint}</p>}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        aria-describedby="identity-doc-help"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
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
        aria-describedby="identity-doc-help"
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition disabled:cursor-default ${
          dragging
            ? "scale-[1.01] cursor-pointer border-marigold bg-marigold/12"
            : "cursor-pointer border-marigold/50 bg-white/50 hover:border-marigold hover:bg-marigold/8"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-marigold" aria-hidden="true" />
        ) : dragging ? (
          <FilePlus2 className="h-6 w-6 text-marigold" aria-hidden="true" />
        ) : (
          <Upload className="h-6 w-6 text-marigold" aria-hidden="true" />
        )}
        <span className="text-sm font-semibold text-ink">
          {uploading ? "Uploading…" : dragging ? "Drop to upload" : "Drag a file here, or click to browse"}
        </span>
        <span id="identity-doc-help" className="text-xs text-ink/40">
          PDF, JPG or PNG · max 5 MB · up to {MAX_IDENTITY_DOCUMENTS} files
        </span>
      </button>

      {error && (
        <p role="alert" className="rounded-xl border border-ember/15 bg-ember/5 px-3 py-2 text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
