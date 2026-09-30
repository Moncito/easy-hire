"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, FolderPlus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import { unsaveSeeker } from "@/lib/client/saved-seekers";
import { Avatar, Button, Card, CardHeader, EmptyState, IconButton, cx } from "@/components/employer/system";
import EmployerConfirmModal from "@/components/employer/EmployerConfirmModal";

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
    <li className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-eh-surface-2 sm:px-6">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 rounded-chip">
        <Avatar name={name} src={photoUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-ui font-semibold text-eh-ink">{name}</p>
          <p className="truncate text-small text-eh-muted">{subtitle}</p>
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
  const [confirmDelete, setConfirmDelete] = useState<TalentListSummary | null>(null);

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

  async function handleDeleteList(listId: string) {
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
    setConfirmDelete(null);
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
    <div className="flex flex-col gap-6">
      <Card as="div" padded={false} className="p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="new-list-name" className="sr-only">
            New list name
          </label>
          <input
            id="new-list-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New list name — e.g. Q1 support hires"
            maxLength={80}
            className="h-9 min-w-0 flex-1 rounded-control border border-eh-line bg-eh-surface px-3 text-ui text-eh-ink outline-none transition-colors duration-150 placeholder:text-eh-muted focus:border-eh-teal"
          />
          <Button type="submit" variant="primary" icon={<FolderPlus />} loading={creating} disabled={!newName.trim()}>
            {creating ? "Creating…" : "New list"}
          </Button>
        </form>
      </Card>

      <Card padded={false} aria-labelledby="bookmarks-heading" className="overflow-hidden">
        <CardHeader
          id="bookmarks-heading"
          className="px-5 py-4 sm:px-6"
          title="Bookmarks"
          description={<span className="num">{bookmarks.length}</span>}
          action={
            <Button href="/employer/talent" size="sm" variant="ghost" icon={<Search />}>
              Search talent
            </Button>
          }
        />
        {bookmarks.length === 0 ? (
          <div className="border-t border-eh-line">
            <EmptyState
              compact
              icon={<Bookmark />}
              title="No bookmarks yet"
              description="Hit Save on a Talent card and they show up here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-eh-line border-t border-eh-line">
            {bookmarks.map((seeker) => (
              <PersonRow
                key={seeker.id}
                href={`/employer/talent/${seeker.id}`}
                name={seeker.fullName}
                subtitle={seeker.headline || seeker.location || "Virtual Assistant"}
                photoUrl={seeker.photoUrl}
                trailing={
                  <div className="flex shrink-0 items-center gap-1.5">
                    {lists.length > 0 && (
                      <>
                        <label className="sr-only" htmlFor={`add-${seeker.id}`}>
                          Add {seeker.fullName} to a list
                        </label>
                        <select
                          id={`add-${seeker.id}`}
                          defaultValue=""
                          disabled={addingTo?.endsWith(`:${seeker.id}`)}
                          onChange={(e) => {
                            const listId = e.target.value;
                            e.target.value = "";
                            if (listId) void handleAddBookmarkToList(listId, seeker);
                          }}
                          className="h-8 max-w-[10rem] rounded-control border border-eh-line bg-eh-surface px-2 text-small text-eh-ink disabled:opacity-50"
                        >
                          <option value="">Add to list…</option>
                          {lists.map((list) => (
                            <option key={list.id} value={list.id}>
                              {list.name}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    <IconButton
                      aria-label={`Remove bookmark for ${seeker.fullName}`}
                      title="Remove bookmark"
                      icon={<X />}
                      onClick={() => void handleUnsave(seeker.id)}
                    />
                  </div>
                }
              />
            ))}
          </ul>
        )}
      </Card>

      <Card padded={false} aria-labelledby="lists-heading" className="overflow-hidden">
        <CardHeader
          id="lists-heading"
          className="px-5 py-4 sm:px-6"
          title="Named lists"
          description={<span className="num">{lists.length}</span>}
        />
        {lists.length === 0 ? (
          <div className="border-t border-eh-line">
            <EmptyState
              compact
              icon={<FolderPlus />}
              title="No lists yet"
              description="Create one above — like “Q1 support hires” — then add people from Bookmarks or a Talent profile."
            />
          </div>
        ) : (
          <ul className="divide-y divide-eh-line border-t border-eh-line">
            {lists.map((list) => {
              const isOpen = expandedId === list.id;
              const items = itemsByList[list.id] ?? [];
              return (
                <li key={list.id}>
                  <div className="flex items-center gap-2 px-5 py-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => void toggleExpand(list.id)}
                      aria-expanded={isOpen}
                      aria-controls={`list-${list.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-chip text-left"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-eh-surface-2 text-eh-ink-2">
                        <Bookmark className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-ui font-semibold text-eh-ink">{list.name}</span>
                        <span className="num block text-small text-eh-muted">
                          {list.itemCount} candidate{list.itemCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <ChevronDown
                        className={cx("ml-auto h-4 w-4 shrink-0 text-eh-muted transition-transform duration-150", isOpen && "rotate-180")}
                        aria-hidden="true"
                      />
                    </button>
                    <IconButton
                      aria-label={`Delete ${list.name}`}
                      title="Delete list"
                      icon={<Trash2 />}
                      disabled={deletingId === list.id}
                      onClick={() => setConfirmDelete(list)}
                      className="hover:text-eh-danger!"
                    />
                  </div>

                  {isOpen && (
                    <div id={`list-${list.id}`} className="border-t border-eh-line bg-eh-surface-2/50">
                      {loadingItemsFor === list.id ? (
                        <p className="px-6 py-3 text-small text-eh-muted" role="status">
                          Loading…
                        </p>
                      ) : items.length === 0 ? (
                        <p className="px-6 py-3 text-small text-eh-muted">Empty — add someone from Bookmarks above.</p>
                      ) : (
                        <ul className="divide-y divide-eh-line">
                          {items.map((item) => (
                            <PersonRow
                              key={item.seekerId}
                              href={`/employer/talent/${item.seeker.id}`}
                              name={item.seeker.fullName}
                              subtitle={item.seeker.headline || item.seeker.location || "Virtual Assistant"}
                              photoUrl={item.seeker.photoUrl}
                              trailing={
                                <IconButton
                                  aria-label={`Remove ${item.seeker.fullName} from ${list.name}`}
                                  title="Remove from list"
                                  icon={<X />}
                                  onClick={() => void handleRemoveItem(list.id, item.seekerId)}
                                />
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
      </Card>

      <EmployerConfirmModal
        open={confirmDelete !== null}
        title="Delete this list?"
        subject={confirmDelete?.name}
        description="The list is removed for your whole team. The candidates themselves and your bookmarks stay."
        confirmLabel="Delete list"
        danger
        loading={confirmDelete !== null && deletingId === confirmDelete.id}
        onCancel={() => {
          if (deletingId) return;
          setConfirmDelete(null);
        }}
        onConfirm={() => confirmDelete && void handleDeleteList(confirmDelete.id)}
      />
    </div>
  );
}