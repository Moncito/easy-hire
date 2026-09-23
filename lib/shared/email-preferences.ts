/**
 * EMAIL PREFERENCE CATEGORIES
 * ============================
 * `User.notifyMessages` / `notifyApplicationUpdates` / `notifyProductDigest`
 * gate EMAIL only — the matching `notifications` row is always written
 * regardless (see createNotification call sites in lib/shared/email.ts).
 * Muting mail must never erase someone's in-app record of what happened.
 *
 * Every email send in the product falls into exactly one of these five
 * buckets. SECURITY and SECURITY-adjacent INTERVIEW mail bypass preferences
 * entirely — a switch (not an if/else chain) below means adding a sixth
 * category forces a decision here instead of silently defaulting one way or
 * the other.
 */
export type EmailCategory =
  /** Verify email, password reset, password-changed confirmation, account-deletion confirmation. Never gated. */
  | "SECURITY"
  /** Interview scheduled/rescheduled/cancelled — a calendar commitment the other party is relying on. Never gated. */
  | "INTERVIEW"
  /** New-message email. Gated by `notifyMessages`. */
  | "MESSAGES"
  /** Application submitted/received, status changed, rejected, and the employer's new-application email. Gated by `notifyApplicationUpdates`. */
  | "APPLICATION_UPDATES"
  /** Seeker job-alert digest and employer weekly Easy AI digest. Gated by `notifyProductDigest`. */
  | "PRODUCT_DIGEST";

/**
 * Pure decision point — no DB access, no I/O. `enabled` is whatever flag is
 * relevant to `category` (e.g. the recipient's `notifyMessages`), already
 * loaded by the caller; it's ignored for SECURITY/INTERVIEW, which always
 * return true regardless of what's passed. Shared by every gated call site
 * so the bypass rule lives in exactly one place.
 */
export function shouldSendCategoryEmail(category: EmailCategory, enabled: boolean): boolean {
  switch (category) {
    case "SECURITY":
    case "INTERVIEW":
      return true;
    case "MESSAGES":
    case "APPLICATION_UPDATES":
    case "PRODUCT_DIGEST":
      return enabled;
    default: {
      const exhaustive: never = category;
      return exhaustive;
    }
  }
}

/**
 * Thin wrapper so a call site's category and gating flag sit right next to
 * the send itself, instead of a bare `if (enabled) await sendEmail(...)`
 * that a future edit could quietly drop. `send` is only invoked when
 * `shouldSendCategoryEmail` allows it — the notification-row write (if any)
 * must happen separately and unconditionally, not inside `send`.
 */
export async function sendCategorizedEmail(
  category: EmailCategory,
  enabled: boolean,
  send: () => Promise<boolean>
): Promise<boolean> {
  if (!shouldSendCategoryEmail(category, enabled)) return false;
  return send();
}
