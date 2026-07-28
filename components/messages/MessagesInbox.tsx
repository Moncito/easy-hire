"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const pollingRef = useRef(false);

  const syncCursor = useCallback((messages: ThreadMessage[]) => {
    lastMessageIdRef.current = lastConfirmedMessage(messages)?.id ?? null;
  }, []);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    const res = await fetch("/api/conversations", fetchOpts);
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
    }
    if (!silent) setLoadingList(false);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    const res = await fetch(`/api/conversations/${id}`, fetchOpts);
    if (res.ok) {
      const data: Thread = await res.json();
      setThread(data);
      syncCursor(data.messages);
    }
    setLoadingThread(false);
  }, [syncCursor]);

  const pollNewMessages = useCallback(async () => {
    if (!activeId || pollingRef.current || document.visibilityState === "hidden") return;

    pollingRef.current = true;
    try {
      const after = lastMessageIdRef.current;
      const url = after
        ? `/api/conversations/${activeId}/messages?after=${encodeURIComponent(after)}`
        : `/api/conversations/${activeId}/messages`;

      const res = await fetch(url, fetchOpts);
      if (!res.ok) return;

      const data = await res.json();
      const incoming = (data.messages ?? []) as ThreadMessage[];
      if (incoming.length === 0) return;

      setThread((prev) => {
        if (!prev) return prev;
        const merged = mergeMessages(
          prev.messages.filter((m) => !m.pending),
          incoming
        );
        lastMessageIdRef.current = lastConfirmedMessage(merged)?.id ?? lastMessageIdRef.current;
        return { ...prev, messages: merged };
      });

      const last = incoming[incoming.length - 1];
      setConversations((prev) => bumpConversationInList(prev, activeId, last.body, last.createdAt));
    } finally {
      pollingRef.current = false;
    }
  }, [activeId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const id = setInterval(() => loadConversations(true), LIST_POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) {
      loadThread(activeId);
    } else {
      setThread(null);
      lastMessageIdRef.current = null;
    }
  }, [activeId, loadThread]);

  useEffect(() => {
    if (!activeId || loadingThread) return;

    void pollNewMessages();
    const id = setInterval(() => void pollNewMessages(), THREAD_POLL_MS);
    return () => clearInterval(id);
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
        setSendError((result as { error?: string }).error || "Failed to send message");
        setThread((prev) =>
          prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticId) } : prev
        );
        setDraft(text);
        return;
      }

      const message = result as ThreadMessage;
      setThread((prev) => {
        if (!prev) return prev;
        const merged = prev.messages.map((m) => (m.id === optimisticId ? message : m));
        lastMessageIdRef.current = message.id;
        return { ...prev, messages: merged };
      });
      setConversations((prev) =>
        bumpConversationInList(prev, activeId, message.body, message.createdAt)
      );
    } catch {
      setSendError("Failed to send message");
      setThread((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticId) } : prev
      );
      setDraft(text);
    }
  }

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
    <div className="flex min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-xs">
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
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => selectConversation(conv.id)}
                className={`flex w-full gap-3 border-b border-ink/5 px-4 py-3 text-left transition-colors hover:bg-mist/80 ${
                  activeId === conv.id ? "bg-teal/5" : ""
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 font-display text-sm font-bold text-teal">
                  {peerLabel(conv).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{peerLabel(conv)}</span>
                    <span className="shrink-0 text-[10px] text-ink/40">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink/45">{peerSubtitle(conv)}</p>
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-ink/55">{conv.lastMessage.body}</p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1.5 text-[10px] font-bold text-white">
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
          <div className="flex flex-1 items-center justify-center text-sm text-ink/45">Loading...</div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-ink/8 px-4 py-3">
              <button
                type="button"
                className="text-xs font-semibold text-teal md:hidden"
                onClick={() => router.push(`${role === "EMPLOYER" ? "/employer" : "/seeker"}/messages`)}
              >
                ← Back
              </button>
              <div>
                <h2 className="font-display text-base font-bold text-ink">
                  {role === "EMPLOYER" ? thread.seeker.fullName : thread.company.companyName}
                </h2>
                {thread.job && (
                  <p className="text-xs text-ink/45">Re: {thread.job.title}</p>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {thread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.isMine
                        ? msg.pending
                          ? "bg-teal/75 text-white"
                          : "bg-teal text-white"
                        : "border border-ink/8 bg-mist text-ink"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${msg.isMine ? "text-white/70" : "text-ink/40"}`}
                    >
                      {msg.pending ? "Sending…" : formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-ink/8 p-4">
              {sendError && (
                <p className="mb-2 text-xs text-ember">{sendError}</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 rounded-xl border border-ink/10 px-4 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/95 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
