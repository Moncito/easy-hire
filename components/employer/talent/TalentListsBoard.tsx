"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, ChevronUp, FolderPlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import { unsaveSeeker } from "@/lib/client/saved-seekers";
import ProButton from "@/components/employer/pro/ProButton";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

export type TalentListSummary = {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
};

export type SavedBookmark = {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  photoUrl: string | null;
};

type TalentListItemSeeker = {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  skills: string[];
  photoUrl: string | null;
};

type TalentListItem = {
  seekerId: string;
  note: string | null;
  seeker: TalentListItemSeeker;
};

type Props = {
  initialLists: TalentListSummary[];
  initialBookmarks: SavedBookmark[];
};

function PersonRow({
  href,
  name,
  subtitle,
  photoUrl,
  trailing,
}: {
  href: string;
  name: string;
  subtitle: string;
  photoUrl: string | null;
  trailing: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <EmployerAvatar
          name={name}
          imageUrl={photoUrl}
          size="sm"
          fallbackClassName="bg-ink/8 text-ink"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-ink/45">{subtitle}</p>
        </div>
      </Link>
      {trailing}
    </li>
  );
}

export default function TalentListsBoard({ initialLists, initialBookmarks }: Props) {
  const [lists, setLists] = useState<TalentListSummary[]>(initialLists);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>(initialBookmarks);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsByList, setItemsByList] = useState<Record<string, TalentListItem[]>>({});
  const [loadingItemsFor, setLoadingItemsFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    const result = await fetchJsonSafe<{
      id: string;
      name: string;
      createdAt: string;
    }>("/api/employer/talent/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);

    if (!result.ok) {
      toast.error(result.error || "Could not create list");
      return;
    }

    setLists((prev) => [{ ...result.data, itemCount: 0 }, ...prev]);
    setNewName("");
    toast.success("List created");
  }

  async function toggleExpand(listId: string) {
    if (expandedId === listId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(listId);
    if (itemsByList[listId]) return;

    setLoadingItemsFor(listId);
    const result = await fetchJsonSafe<{ items: TalentListItem[] }>(
      `/api/employer/talent/lists/${listId}`,
      { cache: "no-store" }
    );
    setLoadingItemsFor(null);

    if (!result.ok) {
      toast.error(result.error || "Could not load list");
      return;
    }
    setItemsByList((prev) => ({ ...prev, [listId]: result.data.items }));
  }

  async function handleRemoveItem(listId: string, seekerId: string) {
    const result = await fetchJsonSafe(`/api/employer/talent/lists/${listId}/items/${seekerId}`, {
      method: "DELETE",
    });
    if (!result.ok) {
      toast.error(result.error || "Could not remove candidate");
      return;
    }
    setItemsByList((prev) => ({
      ...prev,
      [listId]: (prev[listId] ?? []).filter((item) => item.seekerId !== seekerId),
    }));
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, itemCount: Math.max(0, l.itemCount - 1) } : l))
    );
  }

  async function handleDeleteList(listId: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;

    setDeletingId(listId);
    const result = await fetchJsonSafe(`/api/employer/talent/lists/${listId}`, { method: "DELETE" });
    setDeletingId(null);

    if (!result.ok) {
      toast.error(result.error || "Could not delete list");
      return;
    }
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setItemsByList((prev) => {
      const next = { ...prev };
      delete next[listId];
      return next;
    });
    if (expandedId === listId) setExpandedId(null);
    toast.success("List deleted");
  }

  async function handleUnsave(seekerId: string) {
    const res = await unsaveSeeker(seekerId);
    if (!res.ok) {
      toast.error("Couldn't remove bookmark");
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== seekerId));
  }

  async function handleAddBookmarkToList(listId: string, seeker: SavedBookmark) {
    setAddingTo(`${listId}:${seeker.id}`);
    const result = await fetchJsonSafe(`/api/employer/talent/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seekerId: seeker.id }),
    });
    setAddingTo(null);

    if (!result.ok) {
      toast.error(result.error || "Could not add to list");
      return;
    }

    const alreadyInLoaded = (itemsByList[listId] ?? []).some((item) => item.seekerId === seeker.id);
    if (!alreadyInLoaded) {
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, itemCount: l.itemCount + 1 } : l))
      );
    }
    setItemsByList((prev) => {
      const existing = prev[listId];
      if (!existing) return prev;
      if (existing.some((item) => item.seekerId === seeker.id)) return prev;
      return {
        ...prev,
        [listId]: [
          {
            seekerId: seeker.id,
            note: null,
            seeker: {
              id: seeker.id,
              fullName: seeker.fullName,
              headline: seeker.headline,
              location: seeker.location,
              skills: [],
              photoUrl: seeker.photoUrl,
            },
          },
          ...existing,
        ],
      };
    });
    toast.success(`Added to list`);
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleCreate} className="flex flex-wrap items-stretch gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New list name — e.g. Q1 support hires"
          maxLength={80}
          className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink/25"
        />
        <ProButton
          type="submit"
          variant="primary"
          disabled={creating || !newName.trim()}
          icon={<FolderPlus className="h-4 w-4" strokeWidth={2.5} />}
        >
          {creating ? "Creating…" : "New list"}
        </ProButton>
      </form>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/45">
            Bookmarks
            <span className="ml-2 font-data font-semibold text-ink/70">{bookmarks.length}</span>
          </h2>
          <Link href="/employer/talent" className="text-xs font-semibold text-[#9A5B12] hover:underline">
            Search talent
          </Link>
        </div>

        {bookmarks.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink/45">
            No bookmarks yet. Hit Save on a Talent card and they show up here.
          </p>
        ) : (
          <ul className="divide-y divide-ink/6">
            {bookmarks.map((seeker) => (
              <PersonRow
                key={seeker.id}
                href={`/employer/talent/${seeker.id}`}
                name={seeker.fullName}
                subtitle={seeker.headline || seeker.location || "Virtual Assistant"}
                photoUrl={seeker.photoUrl}
                trailing={
                  <div className="flex shrink-0 items-center gap-1">
                    {lists.length > 0 && (
                      <label className="sr-only" htmlFor={`add-${seeker.id}`}>
                        Add {seeker.fullName} to a list
                      </label>
                    )}
                    {lists.length > 0 && (
                      <select
                        id={`add-${seeker.id}`}
                        defaultValue=""
                        disabled={addingTo?.endsWith(`:${seeker.id}`)}
                        onChange={(e) => {
                          const listId = e.target.value;
                          e.target.value = "";
                          if (listId) void handleAddBookmarkToList(listId, seeker);
                        }}
                        className="max-w-[9rem] rounded-full border border-ink/10 bg-white px-2 py-1 text-xs text-ink outline-none"
                      >
                        <option value="">Add to list</option>
                        {lists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUnsave(seeker.id)}
                      className="rounded-lg p-1.5 text-ink/35 transition hover:bg-ink/5 hover:text-ink"
                      aria-label={`Unsave ${seeker.fullName}`}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </div>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink/45">
          Named lists
          <span className="ml-2 font-data font-semibold text-ink/70">{lists.length}</span>
        </h2>

        {lists.length === 0 ? (
          <div className="flex items-start gap-3 text-sm leading-relaxed text-ink/45">
            <FolderPlus className="mt-0.5 h-4 w-4 shrink-0 text-marigold" strokeWidth={2} />
            <p>
              Create a list above — like “Q1 support hires” — then add people from Bookmarks
              or from a Talent profile.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink/6">
            {lists.map((list) => {
              const isOpen = expandedId === list.id;
              const items = itemsByList[list.id] ?? [];
              return (
                <li key={list.id}>
                  <div className="flex items-center gap-2 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(list.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <Bookmark className="h-4 w-4 shrink-0 text-[#9A5B12]" strokeWidth={2.25} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{list.name}</p>
                        <p className="text-xs text-ink/45">
                          {list.itemCount} candidate{list.itemCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteList(list.id, list.name)}
                      disabled={deletingId === list.id}
                      className="rounded-lg p-2 text-ink/30 transition hover:bg-ember/5 hover:text-ember disabled:opacity-50"
                      aria-label={`Delete ${list.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(list.id)}
                      className="rounded-lg p-2 text-ink/35 transition hover:bg-ink/5 hover:text-ink"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
                      ) : (
                        <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
                      )}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="pb-3 pl-7">
                      {loadingItemsFor === list.id ? (
                        <p className="py-2 text-xs text-ink/40">Loading…</p>
                      ) : items.length === 0 ? (
                        <p className="py-2 text-xs text-ink/40">
                          Empty — add someone from Bookmarks above.
                        </p>
                      ) : (
                        <ul className="divide-y divide-ink/5">
                          {items.map((item) => (
                            <PersonRow
                              key={item.seekerId}
                              href={`/employer/talent/${item.seeker.id}`}
                              name={item.seeker.fullName}
                              subtitle={
                                item.seeker.headline || item.seeker.location || "Virtual Assistant"
                              }
                              photoUrl={item.seeker.photoUrl}
                              trailing={
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(list.id, item.seekerId)}
                                  className="rounded-lg p-1.5 text-ink/30 transition hover:bg-ember/5 hover:text-ember"
                                  aria-label={`Remove ${item.seeker.fullName} from ${list.name}`}
                                >
                                  <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                                </button>
                              }
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
