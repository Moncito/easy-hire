import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { getSavedJobsPageData, getAppliedJobIdsForSaved } from "@/lib/saved-jobs";
import { listSavedJobFolders, getSavedJobFolder } from "@/lib/seeker/saved-job-folders";
import { ApiError } from "@/lib/api-error";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import SavedJobsPanel, { type SavedJobEntry } from "@/components/seeker/SavedJobsPanel";
import { Bookmark } from "lucide-react";

/** A folder that doesn't exist, or isn't this seeker's, falls back to the unfiltered view rather than erroring. */
async function loadActiveFolder(userId: string, folderId: string) {
  try {
    return await getSavedJobFolder(userId, folderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function SavedJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { userId } = await requireSeekerPageContext();
  const { folder: folderParam } = await searchParams;
  const folderId = typeof folderParam === "string" && folderParam.trim() ? folderParam.trim() : null;

  let saved: SavedJobEntry[];
  let appliedJobIds: string[];
  let activeFolder: { id: string; name: string } | null = null;
  let folders: Awaited<ReturnType<typeof listSavedJobFolders>>;

  if (folderId) {
    // Folder list is fetched alongside the folder read, never sequentially after it.
    const [folderList, folder] = await Promise.all([
      listSavedJobFolders(userId),
      loadActiveFolder(userId, folderId),
    ]);
    folders = folderList;

    if (folder) {
      activeFolder = { id: folder.id, name: folder.name };
      saved = folder.items.map((item) => ({
        savedJobId: item.savedJobId,
        savedAt: item.savedAt,
        job: item.job,
      }));
      appliedJobIds = await getAppliedJobIdsForSaved(
        userId,
        saved.map((s) => s.job.id)
      );
    } else {
      // The id didn't resolve to one of this seeker's folders — fall back
      // to the unfiltered view rather than erroring.
      const data = await getSavedJobsPageData(userId);
      saved = data.saved.map((s) => ({ savedJobId: s.savedJobId, savedAt: s.savedAt, job: s.job }));
      appliedJobIds = data.appliedJobIds;
    }
  } else {
    // Folder list is fetched alongside the main read, never sequentially after it.
    const [folderList, data] = await Promise.all([listSavedJobFolders(userId), getSavedJobsPageData(userId)]);
    folders = folderList;
    saved = data.saved.map((s) => ({ savedJobId: s.savedJobId, savedAt: s.savedAt, job: s.job }));
    appliedJobIds = data.appliedJobIds;
  }

  const folderSummaries = folders.map((f) => ({ id: f.id, name: f.name, itemCount: f._count.items }));
  // Only meaningful in the unfiltered branch (deciding whether to show the
  // folder bar at all); when a folder is active, folders.length > 0 already
  // guarantees the bar shows, so this doesn't need to be exact there.
  const hasSavedJobs = activeFolder ? true : saved.length > 0;

  const countLabel =
    saved.length === 1 ? "1 saved role" : `${saved.length} saved roles`;

  return (
    <div className="animate-fade-in pb-16">
      <SeekerNavBandBleed
        section="Saved jobs"
        icon={Bookmark}
        badge={
          saved.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
              {countLabel}
            </span>
          ) : undefined
        }
        hint="Your shortlist"
      />

      <div className="pt-6 sm:pt-8">
        <SavedJobsPanel
          // Remounts on folder switch so the panel's own search/filter/saved
          // state (initialized once from props) resets instead of carrying
          // over stale rows from the previously viewed folder.
          key={activeFolder?.id ?? "all"}
          initialSaved={saved}
          appliedJobIds={appliedJobIds}
          folders={folderSummaries}
          activeFolder={activeFolder}
          hasSavedJobs={hasSavedJobs}
        />
      </div>
    </div>
  );
}
