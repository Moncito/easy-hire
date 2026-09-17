"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders `children` into `document.body` instead of wherever this component
 * sits in the React tree. Every admin modal (BulkBar's TypedConfirmDialog,
 * DecisionForm's RejectConfirmModal, ShortcutSheet, SupportActions' dialogs,
 * FeatureFlagEditor's, AdminProfileEditor's, CreateAdminProfileForm's,
 * CreateFeatureFlagForm's) was previously a plain nested `fixed inset-0`
 * div — visually full-screen, but still a DOM descendant of whatever page
 * happened to render it. That let ancestor elements with their own
 * `position: sticky`/`fixed` + `z-index` + `backdrop-filter` (the queue
 * table's sticky header, AdminHeader's sticky header, AdminSidebar's fixed
 * aside) win a browser hit-testing/paint-order quirk against the modal's own
 * higher `z-index` — confirmed by direct testing (`document.elementFromPoint`
 * returned the ancestor, not the modal, despite the modal's z-index being
 * higher) and visually, as the header/sidebar staying unblurred and
 * clickable behind an "open" modal. A portal sidesteps the whole bug class
 * permanently: once mounted on `document.body`, the modal is a top-level
 * sibling of the entire admin app, not nested under anything with its own
 * stacking quirks.
 *
 * SSR guard: `createPortal` needs `document`, which doesn't exist during
 * server rendering. `mounted` starts `false` and flips to `true` in a
 * `useEffect` (client-only), so the portal only renders after hydration —
 * these are all "use client" modals that only ever open in response to a
 * user action, so a one-frame delay before first mount has no visible cost.
 */
export default function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
