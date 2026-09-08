"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import CreateFolderForm, { type CreatedFolder } from "@/components/seeker/CreateFolderForm";
import { useDismissMenu } from "@/components/seeker/useDismissMenu";

export type FolderSummary = { id: string; name: string; itemCount: number };

type Props = {
  folders: FolderSummary[];
  activeFolderId: string | null;
  /** Whether the seeker has any saved jobs at all (unfiltered) — used only to decide whether to show the bar when there are no folders yet. */
  hasSavedJobs: boolean;
};

function pillClass(active: boolean) {
  return `rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
    active
      ? "bg-navy text-mist"
      : "bg-ink/[0.05] text-ink/55 hover:bg-ink/10 hover:text-ink/75"
  }`;
}

export default function SavedJobFolderBar({ folders, activeFolderId, hasSavedJobs }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const menuId = useId();
  const { wrapperRef, triggerRef } = useDismissMenu(creating, () => setCreating(false));

  if (folders.length === 0 && !hasSavedJobs) return null;

  function handleCreated(folder: CreatedFolder) {
    setCreating(false);
    router.push(`/seeker/saved-jobs?folder=${folder.id}`);
  }

  const newFolderButton = (
    <button
      type="button"
      ref={triggerRef}
      onClick={() => setCreating((v) => !v)}
      aria-haspopup="dialog"
      aria-expanded={creating}
      aria-controls={menuId}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-ink/20 px-3.5 py-1.5 text-xs font-semibold text-ink/55 transition hover:border-navy/30 hover:text-navy"
    >
      <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
      New folder
    </button>
  );

  if (folders.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink/50">
          Group your saved jobs into folders to keep them organized.
        </p>
        <div className="relative" ref={wrapperRef}>
          {newFolderButton}
          {creating && (
            <div
              id={menuId}
              role="dialog"
              aria-label="New folder"
              className="absolute left-0 top-full z-20 mt-2 rounded-xl border border-ink/10 bg-white shadow-lg"
            >
              <CreateFolderForm onCreated={handleCreated} onCancel={() => setCreating(false)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by folder">
      <Link href="/seeker/saved-jobs" aria-current={activeFolderId === null ? "true" : undefined} className={pillClass(activeFolderId === null)}>
        All saved
      </Link>
      {folders.map((folder) => {
        const active = activeFolderId === folder.id;
        return (
          <Link
            key={folder.id}
            href={`/seeker/saved-jobs?folder=${folder.id}`}
            aria-current={active ? "true" : undefined}
            className={pillClass(active)}
          >
            {folder.name} <span className="font-data">({folder.itemCount})</span>
          </Link>
        );
      })}
      <div className="relative" ref={wrapperRef}>
        {newFolderButton}
        {creating && (
          <div
            id={menuId}
            role="dialog"
            aria-label="New folder"
            className="absolute left-0 top-full z-20 mt-2 rounded-xl border border-ink/10 bg-white shadow-lg"
          >
            <CreateFolderForm onCreated={handleCreated} onCancel={() => setCreating(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
