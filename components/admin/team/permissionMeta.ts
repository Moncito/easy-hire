import type { AdminPermission } from "./types";

/**
 * Display metadata for the 8-item permission vocabulary
 * (`lib/admin/permissions.ts`'s `ADMIN_PERMISSIONS`). Labels/descriptions are
 * UI text only — the vocabulary itself, and which two are SUPER_ADMIN-only,
 * live in `/lib` and are not re-derived here; `superAdminOnly` below is
 * transcribed straight from that module's own doc comments on `user.delete`
 * and `team.manage` ("SUPER_ADMIN only") so the create/editor forms can grey
 * those two out for any other level instead of letting an operator grant
 * something that silently has no effect.
 */
export const ADMIN_PERMISSION_ORDER: readonly AdminPermission[] = [
  "queue.decide",
  "user.read",
  "user.support",
  "user.delete",
  "document.view",
  "team.manage",
  "revenue.read",
  "cost.read",
];

export const PERMISSION_META: Record<AdminPermission, { label: string; description: string; superAdminOnly?: boolean }> = {
  "queue.decide": {
    label: "Decide queues",
    description: "Approve or reject in the moderation queues, single-item and bulk.",
  },
  "user.read": {
    label: "Read user records",
    description: "Open the 360-degree user/company record.",
  },
  "user.support": {
    label: "Low-risk support actions",
    description: "Send a password reset, resend a verification email.",
  },
  "user.delete": {
    label: "Delete accounts",
    description: "The irreversible RA 10173 anonymisation delete.",
    superAdminOnly: true,
  },
  "document.view": {
    label: "View ID documents",
    description: "Signed-URL reads of ID and verification documents.",
  },
  "team.manage": {
    label: "Manage admin team",
    description: "Create, edit, and revoke admin profiles — this screen.",
    superAdminOnly: true,
  },
  "revenue.read": {
    label: "Read revenue",
    description: "Revenue screens (Phase 6 — not built yet).",
  },
  "cost.read": {
    label: "Read cost",
    description: "Vendor/AI cost screens (Phase 3 — not built yet).",
  },
};
