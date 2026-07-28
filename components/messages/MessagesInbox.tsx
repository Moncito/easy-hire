"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

type Conversation = {
  id: string;
  lastMessageAt: string;
  job: { id: string; title: string } | null;
  company: { id: string; companyName: string; logoUrl: string | null };
  seeker: { id: string; fullName: string; headline: string | null };
  lastMessage: { body: string; createdAt: string; senderUserId: string } | null;
  unreadCount: number;
};

type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderUserId: string;
  isMine: boolean;
  pending?: boolean;
};

type Thread = {
  id: string;
  job: { id: string; title: string } | null;
  company: { id: string; companyName: string; logoUrl: string | null };
  seeker: { id: string; fullName: string; headline: string | null };
  messages: ThreadMessage[];
};

type Props = {
  role: "EMPLOYER" | "SEEKER";
};

const THREAD_POLL_MS = 2000;
const LIST_POLL_MS = 3000;

const fetchOpts: RequestInit = { cache: "no-store" };

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function mergeMessages(existing: ThreadMessage[], incoming: ThreadMessage[]) {
  const seen = new Set(existing.map((m) => m.id));
  const merged = [...existing];
  for (const msg of incoming) {
    if (!seen.has(msg.id)) {
      seen.add(msg.id);
      merged.push(msg);
    }
  }
  return merged.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function lastConfirmedMessage(messages: ThreadMessage[]) {
  return [...messages].reverse().find((m) => !m.pending && !m.id.startsWith("pending-"));
}

function bumpConversationInList(conversations: Conversation[], id: string, body: string, at: string) {
  const updated = conversations.map((c) =>
    c.id === id
      ? {
          ...c,
          lastMessageAt: at,
          lastMessage: { body, createdAt: at, senderUserId: "" },
          unreadCount: 0,
        }
      : c
  );
  return updated.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export default function MessagesInbox({ role }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const [listError, setListError] = useState("");
  const [threadError, setThreadError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(activeId);
  const pollingRef = useRef(false);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const syncCursor = useCallback((messages: ThreadMessage[]) => {
    lastMessageIdRef.current = lastConfirmedMessage(messages)?.id ?? null;
  }, []);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const res = await fetch("/api/conversations", fetchOpts);
      if (!res.ok) {
        if (!silent) setListError("Could not load conversations");
        return;
      }
      const data = await res.json();
      setConversations(data.conversations);
      setListError("");
    } catch {
      if (!silent) setListError("Could not load conversations");
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    setThreadError("");
    try {
      const res = await fetch(`/api/conversations/${id}`, fetchOpts);
      if (!res.ok) {
        setThreadError("Could not load conversation");
        return;
      }
      const data: Thread = await res.json();
      if (activeIdRef.current !== id) return;
      setThread(data);
      syncCursor(data.messages);
    } catch {
      if (activeIdRef.current === id) setThreadError("Could not load conversation");
    } finally {
      if (activeIdRef.current === id) setLoadingThread(false);
    }
  }, [syncCursor]);

  const pollNewMessages = useCallback(async (signal?: AbortSignal) => {
    const conversationId = activeIdRef.current;
    if (!conversationId || pollingRef.current || document.visibilityState === "hidden") return;

    pollingRef.current = true;
    try {
      const after = lastMessageIdRef.current;
      const url = after
        ? `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(after)}`
        : `/api/conversations/${conversationId}/messages`;

      const res = await fetch(url, { ...fetchOpts, signal });
      if (!res.ok || activeIdRef.current !== conversationId) return;

      const data = await res.json();
      const incoming = (data.messages ?? []) as ThreadMessage[];
      if (incoming.length === 0 || activeIdRef.current !== conversationId) return;

      let mergedForCursor: ThreadMessage[] = [];
      setThread((prev) => {
        if (!prev || activeIdRef.current !== conversationId) return prev;
        mergedForCursor = mergeMessages(
          prev.messages.filter((m) => !m.pending),
          incoming
        );
        return { ...prev, messages: mergedForCursor };
      });

      lastMessageIdRef.current =
        lastConfirmedMessage(mergedForCursor)?.id ?? lastMessageIdRef.current;

      const last = incoming[incoming.length - 1];
      setConversations((prev) => bumpConversationInList(prev, conversationId, last.body, last.createdAt));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadConversations();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadConversations]);

  useEffect(() => {
    const id = setInterval(() => loadConversations(true), LIST_POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) {
      const id = window.setTimeout(() => {
        void loadThread(activeId);
      }, 0);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setThread(null);
      lastMessageIdRef.current = null;
    }, 0);
    return () => window.clearTimeout(id);
  }, [activeId, loadThread]);

  useEffect(() => {
    if (!activeId || loadingThread) return;

    const controller = new AbortController();
    void pollNewMessages(controller.signal);
    const id = setInterval(() => void pollNewMessages(controller.signal), THREAD_POLL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [activeId, loadingThread, pollNewMessages]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void loadConversations(true);
      if (activeId) void pollNewMessages();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [activeId, loadConversations, pollNewMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;

    const text = draft.trim();
    const optimisticId = `pending-${Date.now()}`;
    const optimisticAt = new Date().toISOString();

    setSendError("");
    setDraft("");

    const optimistic: ThreadMessage = {
      id: optimisticId,
      body: text,
      createdAt: optimisticAt,
      senderUserId: "",
      isMine: true,
      pending: true,
    };

    setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev));
    setConversations((prev) => bumpConversationInList(prev, activeId, text, optimisticAt));

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        ...fetchOpts,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (result as { error?: string }).error || "Failed to send message";
        setSendError(msg);
        toast.error(msg);
        setThread((prev) =>
          prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticId) } : prev
        );
        setDraft(text);
        return;
      }

      const message = result as ThreadMessage;
      lastMessageIdRef.current = message.id;
      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) => (m.id === optimisticId ? message : m)),
            }
          : prev
      );
      setConversations((prev) =>
        bumpConversationInList(prev, activeId, message.body, message.createdAt)
      );
    } catch {
      setSendError("Failed to send message");
      toast.error("Failed to send message");
      setThread((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticId) } : prev
      );
      setDraft(text);
    }
  }

  const isSeeker = role === "SEEKER";
  const accentDot = isSeeker ? "bg-marigold" : "bg-teal";
  const activeRow = isSeeker ? "bg-marigold/8" : "bg-teal/5";
  const avatarBg = isSeeker ? "bg-navy/10 text-navy" : "bg-teal/10 text-teal";
  const unreadBadge = isSeeker ? "bg-marigold text-ink" : "bg-teal text-white";
  const mineBubble = isSeeker
    ? "bg-navy text-mist"
    : "bg-teal text-white";
  const minePending = isSeeker ? "bg-navy/75 text-mist" : "bg-teal/75 text-white";
  const sendBtn = isSeeker
    ? "bg-marigold text-ink hover:bg-marigold/90"
    : "bg-teal text-white hover:bg-teal/95";
  const focusRing = isSeeker
    ? "focus:border-marigold focus:ring-1 focus:ring-marigold/20"
    : "focus:border-teal focus:ring-1 focus:ring-teal/20";

  function selectConversation(id: string) {
    router.push(`${role === "EMPLOYER" ? "/employer" : "/seeker"}/messages?c=${id}`);
  }

  function peerLabel(conv: Conversation) {
    return role === "EMPLOYER" ? conv.seeker.fullName : conv.company.companyName;
  }

  function peerSubtitle(conv: Conversation) {
    return role === "EMPLOYER"
      ? conv.seeker.headline || "Virtual Assistant"
      : conv.job?.title || "General inquiry";
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-[0_8px_30px_rgba(30,58,95,0.04)]">
      <aside
        className={`flex w-full flex-col border-r border-ink/8 md:w-80 lg:w-96 ${
          activeId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="border-b border-ink/8 px-4 py-4">
          <h1 className="font-display text-lg font-bold text-ink">Messages</h1>
          <p className="mt-0.5 text-xs text-ink/45">In-platform conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {listError && <p className="p-4 text-sm text-ember">{listError}</p>}
          {loadingList ? (
            <p className="p-4 text-sm text-ink/45">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="mb-3 h-8 w-8 text-ink/20" />
              <p className="text-sm font-medium text-ink/60">No conversations yet</p>
              <p className="mt-1 text-xs text-ink/40">
                {role === "EMPLOYER"
                  ? "Message candidates from your applicant board or talent search."
                  : "Employers will appear here when they message you."}
              </p>
              {isSeeker && (
                <Link
                  href="/jobs"
                  className="mt-4 cursor-pointer rounded-xl bg-marigold px-4 py-2 text-sm font-semibold text-ink"
                >
                  Browse jobs
                </Link>
              )}
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => selectConversation(conv.id)}
                className={`flex w-full cursor-pointer gap-3 border-b border-ink/5 px-4 py-3 text-left transition-colors hover:bg-mist/80 ${
                  activeId === conv.id ? activeRow : ""
                }`}
              >
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${avatarBg}`}
                >
                  {peerLabel(conv).slice(0, 2).toUpperCase()}
                  {conv.unreadCount > 0 && (
                    <span
                      className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${accentDot} ring-2 ring-white`}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-sm ${
                        conv.unreadCount > 0 ? "font-bold text-ink" : "font-semibold text-ink"
                      }`}
                    >
                      {peerLabel(conv)}
                    </span>
                    <span className="shrink-0 font-data text-[10px] text-ink/40">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink/45">{peerSubtitle(conv)}</p>
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-ink/55">{conv.lastMessage.body}</p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${unreadBadge}`}
                  >
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className={`flex flex-1 flex-col ${!activeId ? "hidden md:flex" : "flex"}`}>
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-ink/15" />
            <p className="text-sm text-ink/45">Select a conversation</p>
          </div>
        ) : loadingThread || !thread ? (
          <div className="flex flex-1 items-center justify-center text-sm text-ink/45">
            {threadError || "Loading..."}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-ink/8 px-4 py-3">
              <button
                type="button"
                className={`cursor-pointer text-xs font-semibold md:hidden ${
                  isSeeker ? "text-marigold" : "text-teal"
                }`}
                onClick={() =>
                  router.push(`${role === "EMPLOYER" ? "/employer" : "/seeker"}/messages`)
                }
              >
                ← Back
              </button>
              <div>
                <h2 className="font-display text-base font-bold text-ink">
                  {role === "EMPLOYER" ? thread.seeker.fullName : thread.company.companyName}
                </h2>
                {thread.job && (
                  <p className="text-xs text-ink/45">
                    Re:{" "}
                    <Link
                      href={`/jobs/${thread.job.id}`}
                      className="cursor-pointer font-medium text-navy hover:underline"
                    >
                      {thread.job.title}
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <div
              className="flex-1 space-y-3 overflow-y-auto p-4"
              aria-live="polite"
              aria-relevant="additions"
            >
              {thread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.isMine
                        ? msg.pending
                          ? minePending
                          : mineBubble
                        : "border border-ink/8 bg-mist text-ink"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p
                      className={`mt-1 font-data text-[10px] ${
                        msg.isMine ? "text-white/70" : "text-ink/40"
                      }`}
                    >
                      {msg.pending ? "Sending…" : formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-ink/8 p-4">
              {sendError && <p className="mb-2 text-xs text-ember">{sendError}</p>}
              <div className="flex gap-2">
                <label htmlFor="message-draft" className="sr-only">
                  Message
                </label>
                <input
                  id="message-draft"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message..."
                  aria-label="Write a message"
                  className={`flex-1 rounded-xl border border-ink/10 px-4 py-3 text-sm text-ink outline-none ${focusRing}`}
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${sendBtn}`}
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
              <p className="mt-2 text-[11px] text-ink/35">Press Enter to send</p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
