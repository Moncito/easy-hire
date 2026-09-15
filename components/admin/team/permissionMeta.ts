import type { AdminPermission } from "./types";

/**
 * Display metadata for the 12-item permission vocabulary
 * (`lib/admin/permissions.ts`'s `ADMIN_PERMISSIONS`). Labels/descriptions are
 * UI text only — the vocabulary itself, and which three are SUPER_ADMIN-only,
 * live in `/lib` and are not re-derived here; `superAdminOnly` below is
 * transcribed straight from that module's own doc comments on `user.delete`,
 * `team.manage` and `impersonate` ("SUPER_ADMIN only") so the create/editor
 * forms can grey those three out for any other level instead of letting an
 * operator grant something that silently has no effect. `audit.read` is NOT
 * one of the three — it starts granted to nobody but SUPER_ADMIN by default
 * (see `LEVEL_PERMISSIONS` in lib/admin/permissions.ts), but an operator can
 * still grant it to any other level additively, same as `user.read`.
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
  "system.read",
  "system.manage",
  "impersonate",
  "audit.read",
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
  "system.read": {
    label: "Read system health",
    description: "The /admin/system health screen, and reading feature flags.",
  },
  "system.manage": {
    label: "Manage feature flags",
    description: "Create, update, and delete feature flags.",
  },
  "impersonate": {
    label: "Impersonate users",
    description: "Start an impersonation session to view the product as another user.",
    superAdminOnly: true,
  },
  "audit.read": {
    label: "Read audit log",
    description: "Browse every admin's actions on /admin/audit — exposes other admins' identities and decision patterns.",
  },
};
