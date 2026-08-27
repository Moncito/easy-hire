"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Search, Send } from "lucide-react";
import { toast } from "sonner";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

type ConversationListItem = {
  id: string;
  lastMessageAt: string;
  job: { id: string; title: string } | null;
  seeker: { id: string; fullName: string; headline: string | null; photoUrl: string | null };
  lastMessage: { body: string; createdAt: string } | null;
  unreadCount: number;
  applicationStatus?: string | null;
  applicationId?: string | null;
};

type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  senderKind?: "SEEKER" | "EMPLOYER";
  senderLabel?: string | null;
  senderPhotoUrl?: string | null;
  senderRoleLabel?: string | null;
};

type ListFilter = "ALL" | "UNREAD" | "INTERVIEWS" | "HIRED";
type Thread = { id: string; job: { id: string; title: string } | null; seeker: { id: string; fullName: string; headline: string | null; photoUrl: string | null }; messages: ThreadMessage[] };

const LIST_POLL_MS = 4000;
// Open-thread live delivery is a short poll with an `after` cursor (one cheap
// indexed read). A server-relayed SSE stream was tried here but each viewer
// held a long-lived request + its own upstream WebSocket, which starves the
// dev server's worker pool and adds little over a 3s poll for recruiter↔
// candidate messaging. If sub-second delivery is ever needed, subscribe to
// Supabase Realtime directly from the browser (anon key + RLS) instead.
const THREAD_POLL_MS = 3000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(iso: string) {
  return new Date(iso)
    .toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// A message is a "teammate" message when it's from the employer side but not
// from the current viewer — i.e. some other recruiter/owner sent it. Never
// confuse it with the candidate's own messages (senderKind === "SEEKER").
function isTeammateMessage(msg: ThreadMessage) {
  return !msg.isMine && msg.senderKind === "EMPLOYER";
}

// "Recruiter | jane@acme.com" — role and identity together so the reader
// never has to guess which teammate on the company side sent a message.
function senderCaption(msg: ThreadMessage) {
  if (msg.senderRoleLabel && msg.senderLabel) return `${msg.senderRoleLabel} | ${msg.senderLabel}`;
  return msg.senderRoleLabel ?? msg.senderLabel ?? "Teammate";
}

function groupKey(msg: ThreadMessage) {
  if (msg.isMine) return "mine";
  if (isTeammateMessage(msg)) return `teammate:${msg.senderLabel ?? ""}`;
  return "seeker";
}

function statusBadgeClass(status: string) {
  if (status === "HIRED") return "bg-marigold/15 text-[#7a4a0a]";
  if (status === "INTERVIEW") return "bg-teal/10 text-teal";
  if (status === "REJECTED") return "bg-ember/10 text-ember";
  return "bg-ink/6 text-ink/55";
}

export default function CollaboratorMessagesInbox({
  companyId,
  initialConversations,
}: {
  companyId: string;
  initialConversations?: ConversationListItem[];
}) {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations ?? []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(initialConversations === undefined);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const lastMessageIdRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const res = await fetch(`/api/hiring/${companyId}/conversations`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [companyId]);

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/hiring/${companyId}/conversations/${id}`, { cache: "no-store" });
      if (!res.ok) { toast.error("Could not load conversation."); return; }
      const data: Thread = await res.json();
      if (activeIdRef.current !== id) return;
      setThread(data);
      lastMessageIdRef.current = data.messages.at(-1)?.id ?? null;
    } finally {
      if (activeIdRef.current === id) setLoadingThread(false);
    }
  }, [companyId]);

  useEffect(() => {
    const id = window.setTimeout(() => void loadConversations(initialConversations !== undefined), 0);
    return () => window.clearTimeout(id);
  }, [loadConversations, initialConversations]);
  useEffect(() => {
    const id = setInterval(() => void loadConversations(true), LIST_POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  useEffect(() => {
    const preselected = searchParams.get("c");
    if (preselected) openConversation(preselected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openConversation(id: string) {
    activeIdRef.current = id;
    setActiveId(id);
    void loadThread(id);
  }

  const mergeIncoming = useCallback((conversationId: string, incoming: ThreadMessage[]) => {
    if (!incoming.length || activeIdRef.current !== conversationId) return;
    setThread((prev) => {
      if (!prev) return prev;
      const seen = new Set(prev.messages.map((message) => message.id));
      const fresh = incoming.filter((message) => !seen.has(message.id));
      return fresh.length ? { ...prev, messages: [...prev.messages, ...fresh] } : prev;
    });
    lastMessageIdRef.current = incoming.at(-1)?.id ?? lastMessageIdRef.current;
  }, []);

  // Live delivery: short poll with an `after` cursor. Also fires immediately on
  // tab focus so a backgrounded thread catches up the moment you return.
  useEffect(() => {
    if (!activeId) return;
    let inFlight = false;
    const tick = async () => {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const res = await fetch(
          `/api/hiring/${companyId}/conversations/${activeId}/messages${lastMessageIdRef.current ? `?after=${lastMessageIdRef.current}` : ""}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        mergeIncoming(activeId, data.messages ?? []);
      } catch {
        /* transient — next tick retries */
      } finally {
        inFlight = false;
      }
    };
    const id = setInterval(tick, THREAD_POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeId, companyId, mergeIncoming]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bottomRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }, [thread?.messages]);

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  }

  function handleComposerInput(event: React.FormEvent<HTMLTextAreaElement>) {
    const el = event.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  async function handleSend(event?: React.FormEvent) {
    event?.preventDefault();
    if (!activeId || !draft.trim() || sending) return;
    const body = draft.trim();
    setSending(true);
    setDraft("");
    if (composerRef.current) composerRef.current.style.height = "auto";
    try {
      const res = await fetch(`/api/hiring/${companyId}/conversations/${activeId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Could not send message."); setDraft(body); return; }
      const message: ThreadMessage = result.message;
      setThread((prev) => (prev && !prev.messages.some((m) => m.id === message.id) ? { ...prev, messages: [...prev.messages, message] } : prev));
      lastMessageIdRef.current = message.id;
      void loadConversations(true);
    } finally {
      setSending(false);
    }
  }

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );
  const interviewCount = useMemo(
    () => conversations.filter((c) => c.applicationStatus === "INTERVIEW").length,
    [conversations]
  );
  const hiredCount = useMemo(
    () => conversations.filter((c) => c.applicationStatus === "HIRED").length,
    [conversations]
  );

  const filters: { id: ListFilter; label: string; count: number }[] = [
    { id: "ALL", label: "All", count: conversations.length },
    { id: "UNREAD", label: "Unread", count: unreadTotal },
    { id: "INTERVIEWS", label: "Interviews", count: interviewCount },
    { id: "HIRED", label: "Hired", count: hiredCount },
  ];

  const filteredConversations = useMemo(() => {
    let list = conversations;

    if (listFilter === "UNREAD") {
      list = list.filter((c) => c.unreadCount > 0);
    } else if (listFilter === "INTERVIEWS") {
      list = list.filter((c) => c.applicationStatus === "INTERVIEW");
    } else if (listFilter === "HIRED") {
      list = list.filter((c) => c.applicationStatus === "HIRED");
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const job = c.job?.title ?? "";
        const preview = c.lastMessage?.body ?? "";
        return (
          c.seeker.fullName.toLowerCase().includes(q) ||
          job.toLowerCase().includes(q) ||
          preview.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [conversations, listFilter, searchQuery]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  return (
    <>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className={`flex w-full shrink-0 flex-col border-ink/8 bg-white lg:w-[300px] lg:border-r ${activeId ? "hidden lg:flex" : "flex"}`}>
            <div className="border-b border-ink/8 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9A5B12]">Hiring workspace</p>
              <h1 className="mt-1 font-display text-lg font-black text-ink">Messages</h1>
              <p className="mt-0.5 text-xs text-ink/45">Candidate conversations across your roles.</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setListFilter(f.id)}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                      listFilter === f.id
                        ? "bg-marigold/20 text-[#8a5a10]"
                        : "bg-ink/[0.04] text-ink/50 hover:bg-ink/8 hover:text-ink/70"
                    }`}
                  >
                    {f.label}
                    <span className={`ml-1.5 font-data tabular-nums ${listFilter === f.id ? "opacity-70" : "text-ink/35"}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              <label className="relative mt-3 block w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, job, or message…"
                  className="w-full rounded-xl border border-ink/8 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-marigold/30 focus:bg-white focus:ring-2 focus:ring-marigold/10"
                />
              </label>
            </div>
            <div className="flex-1 divide-y divide-ink/5 overflow-y-auto overflow-x-hidden">
              {loadingList && !conversations.length && <p className="p-5 text-sm text-ink/45">Loading…</p>}
              {!loadingList && !filteredConversations.length && (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-marigold/10 text-[#9A5B12]">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-ink/70">
                    {searchQuery || listFilter !== "ALL" ? "No matching conversations" : "No conversations yet"}
                  </p>
                  <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-ink/40">Message a candidate from a candidate review — threads show up here.</p>
                </div>
              )}
              {filteredConversations.map((c) => (
                <button key={c.id} type="button" onClick={() => openConversation(c.id)} className={`flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-3 text-left transition ${activeId === c.id ? "border-marigold bg-marigold/[0.08]" : "border-transparent hover:bg-ink/[0.03]"}`}>
                  <EmployerAvatar name={c.seeker.fullName} imageUrl={c.seeker.photoUrl} size="md" shape="circle" fallbackClassName="bg-ink/10 text-ink" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${c.unreadCount ? "font-bold text-ink" : "font-semibold text-ink"}`}>{c.seeker.fullName}</span>
                      <span className="shrink-0 font-data text-[10px] text-ink/40">{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                    </div>
                    {c.lastMessage && <p className="mt-0.5 truncate text-xs text-ink/50">{c.lastMessage.body}</p>}
                    {c.job && <span className="mt-1 inline-block max-w-full truncate align-bottom rounded-full bg-ink/[0.05] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink/45">{c.job.title}</span>}
                  </div>
                  {c.unreadCount > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-white">{c.unreadCount}</span>}
                </button>
              ))}
            </div>
          </aside>

          <section className={`flex min-h-0 min-w-0 flex-1 flex-col bg-mist/20 ${!activeId ? "hidden lg:flex" : "flex"}`}>
            {!activeId ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-marigold/10 text-[#9A5B12]">
                  <MessageSquare className="h-6 w-6" />
                </span>
                <p className="font-display text-base font-semibold text-ink/55">Select a conversation</p>
                <p className="mt-1 text-xs text-ink/35">Pick a candidate on the left to see the full thread.</p>
              </div>
            ) : loadingThread || !thread ? (
              <div className="flex flex-1 items-center justify-center text-sm text-ink/45">Loading conversation…</div>
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/8 bg-white px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button type="button" className="cursor-pointer text-xs font-semibold text-[#9A5B12] lg:hidden" onClick={() => { setActiveId(null); activeIdRef.current = null; }}>← Back</button>
                    <EmployerAvatar name={thread.seeker.fullName} imageUrl={thread.seeker.photoUrl} size="md" shape="circle" fallbackClassName="bg-ink/10 text-ink" />
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-bold text-ink">{thread.seeker.fullName}</h2>
                      <p className="truncate text-xs text-ink/45">{thread.seeker.headline || "Virtual Assistant"}{thread.job && ` · ${thread.job.title}`}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {thread.job && (
                      <Link
                        href={`/hiring/${companyId}/jobs/${thread.job.id}`}
                        className="hidden cursor-pointer rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/65 transition hover:border-teal/25 hover:text-teal sm:inline-flex"
                      >
                        View pipeline
                      </Link>
                    )}
                    {thread.job && activeConversation?.applicationId && (
                      <Link
                        href={`/hiring/${companyId}/jobs/${thread.job.id}/applications/${activeConversation.applicationId}`}
                        className="hidden cursor-pointer rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/65 transition hover:border-teal/25 hover:text-teal sm:inline-flex"
                      >
                        Review candidate
                      </Link>
                    )}
                  </div>
                </div>

                {thread.job && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ink/5 bg-mist/20 px-5 py-1.5">
                    {activeConversation?.applicationStatus && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusBadgeClass(activeConversation.applicationStatus)}`}
                      >
                        {activeConversation.applicationStatus.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="truncate text-xs text-ink/45">
                      Re:{" "}
                      <Link
                        href={`/hiring/${companyId}/jobs/${thread.job.id}`}
                        className="font-medium text-ink/60 transition hover:text-teal"
                      >
                        {thread.job.title}
                      </Link>
                    </span>
                  </div>
                )}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4" aria-live="polite" aria-relevant="additions">
                  {thread.messages.map((message, idx) => {
                    const prev = thread.messages[idx - 1];
                    const next = thread.messages[idx + 1];
                    const showDate = !prev || !sameDay(prev.createdAt, message.createdAt);
                    const isGroupStart = !prev || groupKey(prev) !== groupKey(message) || showDate;
                    const showMeta =
                      !next || groupKey(next) !== groupKey(message) || !sameDay(message.createdAt, next.createdAt);
                    const showIncomingAvatar = !message.isMine && isGroupStart;
                    const teammate = isTeammateMessage(message);

                    return (
                      <div key={message.id} className={showDate ? "mt-4 first:mt-0" : isGroupStart ? "mt-3" : "mt-0.5"}>
                        {showDate && (
                          <div className="mb-3 flex justify-center">
                            <span className="rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink/50">
                              {formatDateSeparator(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-end gap-2 ${message.isMine ? "justify-end" : "justify-start"}`}>
                          {!message.isMine &&
                            (showIncomingAvatar ? (
                              teammate ? (
                                <EmployerAvatar
                                  name={message.senderLabel ?? "Teammate"}
                                  imageUrl={message.senderPhotoUrl ?? null}
                                  size="sm"
                                  shape="circle"
                                  fallbackClassName="bg-teal/12 text-teal"
                                />
                              ) : (
                                <EmployerAvatar
                                  name={thread.seeker.fullName}
                                  imageUrl={thread.seeker.photoUrl}
                                  size="sm"
                                  shape="circle"
                                  fallbackClassName="bg-ink/10 text-ink"
                                />
                              )
                            ) : (
                              <span className="inline-block h-8 w-8 shrink-0" aria-hidden="true" />
                            ))}

                          <div className={`max-w-[75%] ${message.isMine ? "order-first" : ""}`}>
                            {teammate && isGroupStart && (
                              <p className="mb-0.5 truncate px-1 text-[10px] font-semibold tracking-wide text-teal/70">
                                {senderCaption(message)}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                                message.isMine
                                  ? "rounded-br-sm bg-ink text-mist"
                                  : teammate
                                    ? "rounded-bl-sm border border-teal/25 bg-teal/[0.06] text-ink"
                                    : "rounded-bl-sm border border-ink/8 bg-white text-ink"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{message.body}</p>
                            </div>
                            {showMeta && (
                              <p className={`mt-0.5 px-1 text-[10px] text-ink/35 ${message.isMine ? "text-right" : "text-left"}`}>
                                {formatTime(message.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={handleSend} className="flex shrink-0 items-end gap-2 border-t border-ink/8 bg-white px-4 py-3">
                  <textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onInput={handleComposerInput}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Type a message… (Shift+Enter for a new line)"
                    aria-label="Type a message"
                    rows={1}
                    className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none rounded-2xl border border-ink/10 bg-mist/40 px-4 py-2.5 text-sm leading-6 text-ink outline-none transition focus:border-ink/25 focus:bg-white focus:ring-2 focus:ring-ink/10"
                  />
                  <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message" className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-marigold text-ink transition hover:bg-marigold/90 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
                </form>
              </>
            )}
          </section>
        </div>
    </>
  );
}
