export const DOC_TYPE_OPTIONS = [
  { value: "GOVERNMENT_ID", label: "Government ID", hint: "Front and back, all four corners visible" },
  { value: "PROOF_OF_ADDRESS", label: "Proof of address", hint: "A recent utility bill or bank statement" },
  { value: "SELFIE_WITH_ID", label: "Selfie with ID", hint: "Hold your ID next to your face, both readable" },
  { value: "OTHER", label: "Other", hint: "Any other supporting document" },
] as const;

export type DocType = (typeof DOC_TYPE_OPTIONS)[number]["value"];

export function docTypeLabel(docType: string) {
  return DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType;
}

export type IdentityDocument = {
  id: string;
  fileUrl: string;
  fileName: string;
  docType: string;
  uploadedAt: string;
};

/** Overrides for the two generic envelopes that aren't written for a seeker to read; everything else (validation 400s) passes the server's own message through untouched. */
export function uploadErrorMessage(status: number, fallback: string): string {
  if (status === 401) return "Your session expired. Refresh the page and sign in again.";
  if (status === 429) return "Too many uploads. Try again in a few minutes.";
  return fallback;
}

export function fileKind(fileName: string): "image" | "pdf" {
  return /\.(png|jpe?g|webp)$/i.test(fileName) ? "image" : "pdf";
}
