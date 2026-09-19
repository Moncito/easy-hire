import { useState } from "react";
import { Plus, X } from "lucide-react";
import { formatCertification, parseCertification } from "@/lib/seeker/profile-format";
import { inputClassName, type UpdateField } from "./shared";

type Props = {
  linkedinUrl: string;
  portfolioUrl: string;
  certifications: string[];
  onChange: UpdateField;
};

export default function CredentialsBucket({
  linkedinUrl,
  portfolioUrl,
  certifications,
  onChange,
}: Props) {
  const [certDraft, setCertDraft] = useState({ name: "", issuer: "", year: "" });

  function addCertification() {
    const name = certDraft.name.trim();
    if (!name) return;
    const encoded = formatCertification({
      name,
      issuer: certDraft.issuer.trim(),
      year: certDraft.year.trim(),
    });
    if (certifications.includes(encoded)) {
      setCertDraft({ name: "", issuer: "", year: "" });
      return;
    }
    onChange("certifications", [...certifications, encoded]);
    setCertDraft({ name: "", issuer: "", year: "" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="linkedinUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
            LinkedIn
          </label>
          <input
            id="linkedinUrl"
            type="url"
            value={linkedinUrl}
            onChange={(e) => onChange("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="portfolioUrl" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
            Portfolio / website
          </label>
          <input
            id="portfolioUrl"
            type="url"
            value={portfolioUrl}
            onChange={(e) => onChange("portfolioUrl", e.target.value)}
            placeholder="https://..."
            className={inputClassName}
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Certifications</p>
        <p className="mb-3 text-sm text-ink/55">Name, issuer, and year for each credential.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="certDraftName" className="sr-only">
              Certificate name
            </label>
            <input
              id="certDraftName"
              value={certDraft.name}
              onChange={(e) => setCertDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Certificate name"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="certDraftIssuer" className="sr-only">
              Certificate issuer
            </label>
            <input
              id="certDraftIssuer"
              value={certDraft.issuer}
              onChange={(e) => setCertDraft((d) => ({ ...d, issuer: e.target.value }))}
              placeholder="Issuer (optional)"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="certDraftYear" className="sr-only">
              Certificate year
            </label>
            <input
              id="certDraftYear"
              value={certDraft.year}
              onChange={(e) => setCertDraft((d) => ({ ...d, year: e.target.value }))}
              placeholder="Year (optional)"
              className={inputClassName}
            />
          </div>
          <button
            type="button"
            onClick={addCertification}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-mist hover:bg-navy/90"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        {certifications.length > 0 && (
          <ul className="mt-4 space-y-2">
            {certifications.map((c) => {
              const parsed = parseCertification(c);
              const label = [parsed.name, parsed.issuer, parsed.year].filter(Boolean).join(" · ");
              return (
                <li
                  key={c}
                  className="flex items-center justify-between rounded-xl border border-ink/8 bg-mist/60 px-3 py-2 text-sm text-ink"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => onChange("certifications", certifications.filter((x) => x !== c))}
                    className="cursor-pointer rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
                    aria-label={`Remove ${label}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
