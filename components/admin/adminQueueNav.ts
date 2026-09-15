import type { QueueKind } from "@/lib/admin/queues";

/**
 * The five moderation queue kinds, in nav order — shared between
 * `AdminSidebar.tsx` (renders them as links) and `AdminHeader.tsx` (renders
 * them in the pending-items notification panel), so the label/href/kind
 * mapping lives in exactly one place rather than being retyped twice.
 * `QueueKind` is a plain TypeScript union (lib/admin/queues.ts), not a
 * runtime value, so this import is type-only and does not pull `/lib`'s
 * Prisma-backed code into either client bundle.
 */
export const ADMIN_QUEUE_NAV_ITEMS: { kind: QueueKind; label: string; href: string }[] = [
  { kind: "COMPANY", label: "Companies", href: "/admin/queues/companies" },
  { kind: "SEEKER", label: "Seekers", href: "/admin/queues/seekers" },
  { kind: "JOB", label: "Jobs", href: "/admin/queues/jobs" },
  { kind: "REVIEW", label: "Reviews", href: "/admin/queues/reviews" },
  { kind: "REPORT", label: "Reports", href: "/admin/queues/reports" },
];
