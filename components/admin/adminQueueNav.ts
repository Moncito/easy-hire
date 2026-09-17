import { Building2, Users, Briefcase, ScrollText, AlertOctagon } from "lucide-react";
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

/**
 * Semantic icon color per queue kind — Teal for employer/company-side
 * content, Marigold for seeker-side content, Navy for shared/structural
 * content (reviews and reports touch both sides). Relocated here from
 * `AdminSidebar.tsx` (docs/ADMIN-CONSOLE-PLAN.md admin-home task, "one
 * shared module, not two independently-typed copies") — `app/admin/
 * dashboard/page.tsx`'s Band 3 queue-health tiles need the exact same
 * icon+color treatment the sidebar already uses, and duplicating this map a
 * third time would have been the same mistake `ADMIN_QUEUE_NAV_ITEMS` itself
 * was extracted to prevent.
 */
export const QUEUE_ICON_COLOR: Record<QueueKind, string> = {
  COMPANY: "text-teal",
  SEEKER: "text-marigold",
  JOB: "text-teal",
  REVIEW: "text-navy",
  REPORT: "text-navy",
};

/** Relocated from `AdminSidebar.tsx` alongside `QUEUE_ICON_COLOR` — see that constant's doc comment. */
export const QUEUE_KIND_ICON: Record<QueueKind, typeof Building2> = {
  COMPANY: Building2,
  SEEKER: Users,
  JOB: Briefcase,
  REVIEW: ScrollText,
  REPORT: AlertOctagon,
};
