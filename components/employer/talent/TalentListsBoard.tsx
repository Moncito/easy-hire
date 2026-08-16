"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronDown, ChevronUp, FolderPlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import NeoSurface from "@/components/employer/pro/NeoSurface";
import NeoButton from "@/components/employer/pro/NeoButton";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

export type TalentListSummary = {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
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
};

export default function TalentListsBoard({ initialLists }: Props) {
  const [lists, setLists] = useState<TalentListSummary[]>(initialLists);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsByList, setItemsByList] = useState<Record<string, TalentListItem[]>>({});
  const [loadingItemsFor, setLoadingItemsFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <>
      <form onSubmit={handleCreate} className="mb-4 flex flex-wrap items-stretch gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New list name — e.g. Q1 support hires"
          maxLength={80}
          className="neo-inset-sm min-w-0 flex-1 rounded-xl border-0 px-3.5 py-2.5 text-sm text-[color:var(--neo-ink)] outline-none placeholder:text-[color:var(--neo-muted)] focus:ring-2 focus:ring-[color:var(--neo-teal)]/30"
        />
        <NeoButton
          type="submit"
          variant="primary"
          disabled={creating || !newName.trim()}
          icon={<FolderPlus className="h-4 w-4" strokeWidth={2.5} />}
        >
          {creating ? "Creating…" : "New list"}
        </NeoButton>
      </form>

      <NeoSurface variant="raised" pressable className="mb-4">
        <Link href="/employer/talent" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="neo-inset-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--neo-teal)]">
              <Bookmark className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-sm font-bold text-[color:var(--neo-ink)]">All saved candidates</p>
              <p className="text-xs text-[color:var(--neo-muted)]">
                Every candidate you&apos;ve bookmarked — open Talent search and toggle &ldquo;Saved&rdquo;.
              </p>
            </div>
          </div>
        </Link>
      </NeoSurface>

      {lists.length === 0 ? (
        <NeoSurface variant="inset" className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="neo-raised-sm flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--neo-gold)]">
            <FolderPlus className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-[color:var(--neo-ink)]">
              No named lists yet
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[color:var(--neo-muted)]">
              Create a list above like &ldquo;Q1 support hires&rdquo; or &ldquo;Bilingual VAs&rdquo;,
              then add candidates straight from their profile in Talent search.
            </p>
          </div>
        </NeoSurface>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => {
            const isOpen = expandedId === list.id;
            const items = itemsByList[list.id] ?? [];
            return (
              <NeoSurface key={list.id} variant="raised" noPadding className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(list.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="neo-inset-sm flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--neo-teal)]">
                      <Bookmark className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[color:var(--neo-ink)]">{list.name}</p>
                      <p className="text-xs text-[color:var(--neo-muted)]">
                        {list.itemCount} candidate{list.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteList(list.id, list.name)}
                      disabled={deletingId === list.id}
                      className="rounded-lg p-2 text-[color:var(--neo-muted)] transition hover:text-[color:var(--neo-ember)] disabled:opacity-50"
                      aria-label={`Delete ${list.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(list.id)}
                      className="rounded-lg p-2 text-[color:var(--neo-muted)] transition hover:text-[color:var(--neo-ink)]"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
                      ) : (
                        <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
                      )}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="neo-inset-sm border-t border-[color:var(--neo-ink)]/[0.05] p-3">
                    {loadingItemsFor === list.id ? (
                      <p className="px-2 py-3 text-xs text-[color:var(--neo-muted)]">Loading…</p>
                    ) : items.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-[color:var(--neo-muted)]">
                        No candidates yet — add them from a profile in Talent search.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((item) => (
                          <li
                            key={item.seekerId}
                            className="flex items-center justify-between gap-2 rounded-xl bg-[color:var(--neo-surface)] px-2.5 py-2"
                          >
                            <Link
                              href={`/employer/talent/${item.seeker.id}`}
                              className="flex min-w-0 flex-1 items-center gap-2.5"
                            >
                              <EmployerAvatar
                                name={item.seeker.fullName}
                                imageUrl={item.seeker.photoUrl}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[color:var(--neo-ink)]">
                                  {item.seeker.fullName}
                                </p>
                                <p className="truncate text-[10px] text-[color:var(--neo-muted)]">
                                  {item.seeker.headline || item.seeker.location || "Virtual Assistant"}
                                </p>
                              </div>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(list.id, item.seekerId)}
                              className="shrink-0 rounded-lg p-1.5 text-[color:var(--neo-muted)] transition hover:text-[color:var(--neo-ember)]"
                              aria-label={`Remove ${item.seeker.fullName} from ${list.name}`}
                            >
                              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </NeoSurface>
            );
          })}
        </div>
      )}
    </>
  );
}
