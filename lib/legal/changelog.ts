// What changed in each Terms/Privacy version, shown on /accept-terms. Edge-
// and client-safe (no Prisma). Add an entry whenever CURRENT_TERMS_VERSION in
// ./terms-version.ts is bumped — the accept page reads the current one.

import { CURRENT_TERMS_VERSION } from "./terms-version";

export type LegalChange = {
  title: string;
  description: string;
  /** Deep link into the updated document, e.g. "/privacy#easy-ai". */
  href: string;
};

export type LegalVersion = {
  version: string;
  /** Human-readable effective date. */
  effective: string;
  changes: LegalChange[];
};

export const LEGAL_VERSIONS: LegalVersion[] = [
  {
    version: "2026-10-01",
    effective: "October 1, 2026",
    changes: [
      {
        title: "What EasyHire is, and who can use it",
        description:
          "We're a self-service job board, not a recruitment agency. Accounts are for people 18 and over, and seekers never pay us.",
        href: "/terms#what-easyhire-is",
      },
      {
        title: "Employer and seeker responsibilities",
        description:
          "Clearer rules for posting jobs, including no age or other discriminatory requirements, and for applying and messaging.",
        href: "/terms#employer-responsibilities",
      },
      {
        title: "Privacy, verification documents, and your rights",
        description:
          "What we collect, who sees it, which providers process it, how long we keep it, and how to export or delete your data.",
        href: "/privacy#information-we-collect",
      },
      {
        title: "Easy AI and automated features",
        description:
          "How AI helps employers draft, summarise, and rank, and our promise that no candidate is rejected automatically.",
        href: "/privacy#easy-ai",
      },
      {
        title: "Paid plans and billing",
        description: "How Employer Pro renews, how to cancel, and when refunds apply.",
        href: "/terms#billing",
      },
    ],
  },
];

export function currentLegalVersion(): LegalVersion {
  const found = LEGAL_VERSIONS.find((v) => v.version === CURRENT_TERMS_VERSION);
  if (!found) {
    throw new Error(`No LEGAL_VERSIONS entry for CURRENT_TERMS_VERSION ${CURRENT_TERMS_VERSION}`);
  }
  return found;
}
