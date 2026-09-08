"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderPlus } from "lucide-react";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import CreateFolderForm, { type CreatedFolder } from "@/components/seeker/CreateFolderForm";
import { useDismissMenu } from "@/components/seeker/useDismissMenu";
import type { FolderSummary } from "@/components/seeker/SavedJobFolderBar";

type Props = {
  savedJobId: string;
  jobTitle: string;
  folders: FolderSummary[];
};

/**
 * Per-row "Add to folder" control shown only in the unfiltered "All saved"
 * list. Deliberately doesn't show per-folder membership (the page doesn't
 * load it) — picking a folder always POSTs, and the endpoint is idempotent.
 * Trigger/panel semantics modeled on SeekerNotificationBell.tsx, same as
 * FolderManagementMenu.
 */
export default function AddToFolderMenu({ savedJobId, jobTitle, folders }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [pendingFolderId, setPendingFolderId] = useState<string | null>(null);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    setCreatingNew(false);
  }

  const { wrapperRef, triggerRef } = useDismissMenu(open, close);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  async function addToFolder(folderId: string, folderName: string) {
    setPendingFolderId(folderId);
    const result = await fetchJsonSafe(`/api/seeker/saved-job-folders/${folderId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedJobId }),
    });
    setPendingFolderId(null);
    if (!result.ok) {
      toast.error(result.error || "Couldn't add to that folder — try again");
      return;
    }
    close();
    toast.success(`Added to ${folderName}`);
    router.refresh();
  }

  function handleCreated(folder: CreatedFolder) {
    // The folder itself is already created at this point regardless of
    // whether the follow-up add succeeds — fall back to the list view
    // rather than leaving a spent create form on screen.
    setCreatingNew(false);
    void addToFolder(folder.id, folder.name);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3.5 py-2 text-xs font-semibold text-ink/60 transition hover:border-navy/25 hover:text-navy"
      >
        <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
        Add to folder
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          tabIndex={-1}
          role="group"
          aria-label={`Add "${jobTitle}" to a folder`}
          className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg outline-none"
        >
          {creatingNew ? (
            <CreateFolderForm
              submitLabel="Create & add"
              onCreated={handleCreated}
              onCancel={() => setCreatingNew(false)}
            />
          ) : (
            <div className="max-h-64 overflow-y-auto p-1.5">
              {folders.length === 0 ? (
                <p className="px-3 py-2 text-xs text-ink/40">No folders yet.</p>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    disabled={pendingFolderId === folder.id}
                    onClick={() => void addToFolder(folder.id, folder.name)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink/75 transition hover:bg-ink/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="truncate">{folder.name}</span>
                    <span className="shrink-0 font-data text-[11px] text-ink/40">{folder.itemCount}</span>
                  </button>
                ))
              )}
              <div className="mt-1 border-t border-ink/[0.06] pt-1">
                <button
                  type="button"
                  onClick={() => setCreatingNew(true)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-navy transition hover:bg-navy/5"
                >
                  <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  New folder…
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
