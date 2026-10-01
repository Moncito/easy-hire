// Single source for the business details the Terms and Privacy Policy print.
// The Internet Transactions Act (RA 11967) and payment-provider onboarding
// (PayMongo, Paddle) both expect these on the site. Fields left `null` are
// not registered yet — the legal pages render a neutral "will be published"
// line instead of a fake value, so fill these in as soon as registration
// lands rather than editing the page copy.

export const businessInfo = {
  brandName: "EasyHire VA Solutions",
  /** Registered business / corporate name, exactly as on the DTI or SEC certificate. */
  legalName: null as string | null,
  /** e.g. "DTI Business Name Reg. No. 1234567" or "SEC Reg. No. ...". */
  registration: null as string | null,
  /** Registered business address. */
  address: null as string | null,
  /** City whose courts hear disputes under the Terms (usually the registered address's city). */
  venueCity: null as string | null,
  /** Data Protection Officer's name, as registered with the National Privacy Commission. */
  dpoName: null as string | null,
  contact: {
    general: "hello@easyhire.com",
    legal: "legal@easyhire.com",
    privacy: "privacy@easyhire.com",
  },
} as const;

/** Display name for "EasyHire" as a contracting party. */
export function contractingPartyName(): string {
  return businessInfo.legalName ?? businessInfo.brandName;
}
