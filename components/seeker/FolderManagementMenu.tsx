"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, AlertTriangle, X } from "lucide-react";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import { useDismissMenu } from "@/components/seeker/useDismissMenu";

type Folder = { id: string; name: string };

/**
 * Delete confirmation, modeled directly on
 * components/seeker/WithdrawApplicationButton.tsx (portal, focus/scroll
 * lock, Escape-to-close, ember accent stripe — Ember is legitimate here
 * since deleting a folder is a genuine destructive action).
 */
function DeleteFolderDialog({
  folder,
  onCancel,
  onDeleted,
}: {
  folder: Folder;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  // No `mounted` guard here, unlike WithdrawApplicationButton: that component
  // is always mounted and gates its own portal internally, whereas this dialog
  // is only rendered once `confirmingDelete` is true — i.e. after a click — so
  // it never renders during SSR and `document.body` is always available.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [loading, onCancel]);

  async function handleConfirm() {
    setLoading(true);
    const result = await fetchJsonSafe(`/api/seeker/saved-job-folders/${folder.id}`, { method: "DELETE" });
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error || "Couldn't delete this folder — try again");
      return;
    }
    toast.success(`"${folder.name}" deleted — its jobs are still saved`);
    onDeleted();
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-ink/45 backdrop-blur-sm"
        aria-label="Dismiss"
        onClick={loading ? undefined : onCancel}
      />
      <div
        className="relative w-full max-w-[26rem] overflow-hidden rounded-t-2xl border border-ink/10 bg-white shadow-[0_24px_64px_-16px_rgba(32,36,43,0.28)] sm:rounded-3xl"
        role="dialog"
        aria-labelledby="delete-folder-title"
        aria-describedby="delete-folder-desc"
        aria-modal="true"
      >
        <div className="h-1.5 w-full bg-ember/80" />
        <div className="px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="absolute right-4 top-5 cursor-pointer rounded-full p-1.5 text-ink/35 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ember/10 text-ember"
            aria-hidden="true"
          >
            <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
          </div>

          <h2 id="delete-folder-title" className="mt-4 font-display text-xl font-bold tracking-tight text-ink">
            Delete &ldquo;{folder.name}&rdquo;?
          </h2>
          <p id="delete-folder-desc" className="mt-2 text-sm leading-relaxed text-ink/50">
            The folder will be deleted, but the jobs inside it stay saved — they&rsquo;ll still show
            up under All saved.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-ink/[0.06] bg-mist/40 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink/[0.03] disabled:opacity-60"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-ember px-4 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-60"
          >
            {loading ? "Deleting…" : "Delete folder"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Rename + delete menu next to the heading when a folder is active. Trigger
 * semantics (aria-haspopup/aria-expanded/aria-controls, Escape-to-close with
 * focus returned to the trigger, click-outside close, focus moved into the
 * panel on open) are modeled on components/seeker/SeekerNotificationBell.tsx.
 */
export default function FolderManagementMenu({ folder }: { folder: Folder }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const panelId = useId();
  const errorId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    setRenaming(false);
    setRenameError(null);
  }

  const { wrapperRef, triggerRef } = useDismissMenu(open, close);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // Seeding the rename field happens in the toggle handler rather than an
  // effect keyed on `open` — the value only ever needs to be reset by the
  // interaction that opens the menu, so an effect would just be a cascading
  // render after the fact (react-hooks/set-state-in-effect).
  function toggle() {
    if (open) {
      close();
      return;
    }
    setRenameValue(folder.name);
    setRenameError(null);
    setOpen(true);
  }

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Name is required");
      return;
    }
    setRenameLoading(true);
    setRenameError(null);
    const result = await fetchJsonSafe(`/api/seeker/saved-job-folders/${folder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setRenameLoading(false);
    if (!result.ok) {
      setRenameError(result.error);
      return;
    }
    close();
    toast.success("Folder renamed");
    router.refresh();
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        aria-label="Folder options"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/40 transition hover:bg-ink/[0.06] hover:text-ink"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          tabIndex={-1}
          role="group"
          aria-label="Folder options"
          className="absolute left-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg outline-none"
        >
          {renaming ? (
            <form onSubmit={handleRenameSubmit} className="space-y-2 p-3">
              <label htmlFor={`${panelId}-rename`} className="block text-xs font-semibold text-ink/60">
                Rename folder
              </label>
              <input
                id={`${panelId}-rename`}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                maxLength={80}
                autoFocus
                aria-describedby={renameError ? errorId : undefined}
                aria-invalid={renameError ? true : undefined}
                className="w-full rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-navy/25 focus:ring-2 focus:ring-navy/10"
              />
              {renameError && (
                <p id={errorId} role="alert" className="text-xs text-ember">
                  {renameError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenaming(false)}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-ink/55 transition hover:bg-ink/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading}
                  className="cursor-pointer rounded-lg bg-marigold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-marigold/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renameLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => setRenaming(true)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink/75 transition hover:bg-ink/[0.05]"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Rename folder
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirmingDelete(true);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink/75 transition hover:bg-ember/10 hover:text-ember"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete folder
              </button>
            </div>
          )}
        </div>
      )}

      {confirmingDelete && (
        <DeleteFolderDialog
          folder={folder}
          onCancel={() => setConfirmingDelete(false)}
          onDeleted={() => {
            setConfirmingDelete(false);
            router.push("/seeker/saved-jobs");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
