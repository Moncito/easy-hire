"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  BadgeCheck,
  CheckCheck,
  ChevronDown,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import MessagesNavBand from "@/components/messages/MessagesNavBand";
import type { ConversationListItem } from "@/lib/messages";
import {
  getConversation,
  listConversations,
  pollConversationMessages,
  sendConversationMessage,
} from "@/lib/client/conversations";
import { fetchJsonSafe, noStore } from "@/lib/client/fetch-json";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { callEasyAi } from "@/components/employer/pro/useEasyAi";

type Conversation = ConversationListItem;

type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderUserId: string;
  isMine: boolean;
  readAt?: string | null;
  pending?: boolean;
};

type Thread = {
  id: string;
  job: { id: string; title: string } | null;
  company: { id: string; companyName: string; logoUrl: string | null };
  seeker: { id: string; fullName: string; headline: string | null; photoUrl?: string | null };
  messages: ThreadMessage[];
};

type Props = {
  role: "EMPLOYER" | "SEEKER";
  fillNavClearance?: boolean;
  initialConversations?: Conversation[];
};

type ListFilter = "ALL" | "UNREAD" | "INTERVIEWS" | "HIRED";

const THREAD_POLL_MS = 2000;
const LIST_POLL_MS = 3000;

const fetchOpts: RequestInit = noStore;

const AI_DRAFT_TONES = [
  { value: "first_outreach", label: "First outreach" },
  { value: "follow_up", label: "Follow-up" },
  { value: "interview_invite", label: "Interview invite" },
  { value: "rejection", label: "Rejection" },
] as const;

type MessageDraftResult = { body: string };

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateSeparator(iso: string) {
  return new Date(iso)
    .toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
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

function statusBadgeClass(status: string, isSeeker: boolean) {
  if (status === "HIRED") return "bg-marigold/15 text-[#7a4a0a]";
  if (status === "INTERVIEW") return isSeeker ? "bg-navy/10 text-navy" : "bg-teal/10 text-teal";
  if (status === "REJECTED") return "bg-ember/10 text-ember";
  return "bg-ink/6 text-ink/55";
}

function peerInitials(label: string) {
  return label.slice(0, 2).toUpperCase();
}

function PeerAvatar({
  label,
  logoUrl,
  avatarClass,
  size = "md",
}: {
  label: string;
  logoUrl?: string | null;
  avatarClass: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-11 w-11";
  const text = size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-1 ring-ink/10`}
      />
    );
  }

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full font-display font-bold ${text} ${avatarClass}`}
    >
      {peerInitials(label)}
    </div>
  );
}

export default function MessagesInbox({
  role,
  fillNavClearance = false,
  initialConversations,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");
  const hasInitialData = initialConversations !== undefined;
  const { isPro } = useEmployerShell();

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations ?? []);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loadingList, setLoadingList] = useState(!hasInitialData);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [aiToneMenuOpen, setAiToneMenuOpen] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [sendError, setSendError] = useState("");
  const [listError, setListError] = useState("");
  const [threadError, setThreadError] = useState("");
  const [listFilter, setListFilter] = useState<ListFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const aiToneButtonRef = useRef<HTMLButtonElement>(null);
  const aiToneMenuRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(activeId);
  const pollingRef = useRef(false);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const didAutoOpen = useRef(false);
  useEffect(() => {
    if (role !== "EMPLOYER" || didAutoOpen.current || activeId || loadingList) return;
    if (conversations.length === 0) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    didAutoOpen.current = true;
    router.replace(`/employer/messages?c=${conversations[0].id}`);
  }, [role, activeId, loadingList, conversations, router]);

  useEffect(() => {
    if (!aiToneMenuOpen) return;

    function onPointerDown(e: MouseEvent) {
      const root = aiToneButtonRef.current?.parentElement;
      if (root && !root.contains(e.target as Node)) {
        setAiToneMenuOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setAiToneMenuOpen(false);
        aiToneButtonRef.current?.focus();
        return;
      }

      const menu = aiToneMenuRef.current;
      if (!menu) return;
      const items = Array.from(
        menu.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])')
      );
      if (items.length === 0) return;

      const currentIndex = items.findIndex((el) => el === document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(currentIndex + 1 + items.length) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      aiToneMenuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]')?.focus();
    }, 0);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [aiToneMenuOpen]);

  const syncCursor = useCallback((messages: ThreadMessage[]) => {
    lastMessageIdRef.current = lastConfirmedMessage(messages)?.id ?? null;
  }, []);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const data = await listConversations(fetchOpts);
      if (!data) {
        if (!silent) setListError("Could not load conversations");
        return;
      }
      setConversations(data.conversations);
      setListError("");
    } catch {
      if (!silent) setListError("Could not load conversations");
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    setAiToneMenuOpen(false);
    setLoadingThread(true);
    setThreadError("");
    try {
      const data = await getConversation(id, fetchOpts);
      if (!data) {
        setThreadError("Could not load conversation");
        return;
      }
      const thread = data as Thread;
      if (activeIdRef.current !== id) return;
      setThread(thread);
      syncCursor(thread.messages);
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
      const data = await pollConversationMessages(conversationId, after, { ...fetchOpts, signal });
      if (!data || activeIdRef.current !== conversationId) return;

      const incoming = ((data as { messages?: ThreadMessage[] }).messages ?? []) as ThreadMessage[];
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
      void loadConversations(hasInitialData);
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadConversations, hasInitialData]);

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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bottomRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
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
      const result = await sendConversationMessage(activeId, text);

      if (!result.ok) {
        const msg = result.error || "Failed to send message";
        setSendError(msg);
        toast.error(msg);
        setThread((prev) =>
          prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticId) } : prev
        );
        setDraft(text);
        return;
      }

      const message = (result.data.message ?? result.data) as ThreadMessage;
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

  /**
   * Employer Pro outreach draft. `message-draft` needs an `applicationId`,
   * which conversations don't carry client-side — so this looks it up via
   * the existing per-job applications endpoint (matched by seeker id) rather
   * than adding a new API route. Fills the composer; never sends anything.
   */
  async function handleAiDraft(tone: (typeof AI_DRAFT_TONES)[number]["value"]) {
    if (!thread?.job?.id) return;
    setAiToneMenuOpen(false);
    setAiDrafting(true);
    try {
      const appsResult = await fetchJsonSafe<Array<{ id: string; seeker: { id: string } }>>(
        `/api/jobs/${thread.job.id}/applications`,
        fetchOpts
      );
      if (!appsResult.ok) {
        toast.error(appsResult.error || "Could not load this application");
        return;
      }
      const application = appsResult.data.find((app) => app.seeker.id === thread.seeker.id);
      if (!application) {
        toast.error("Could not find this candidate's application for that job");
        return;
      }

      const result = await callEasyAi<MessageDraftResult>("message-draft", {
        applicationId: application.id,
        tone,
      });
      if (result?.configured && result.data) {
        setDraft(result.data.body);
      }
    } finally {
      setAiDrafting(false);
    }
  }

  const isSeeker = role === "SEEKER";
  const isEmployerPro = !isSeeker && isPro;
  const basePath = isSeeker ? "/seeker" : "/employer";
  const accentDot = isSeeker ? "bg-marigold" : isEmployerPro ? "bg-marigold" : "bg-teal";
  const activeRow = isSeeker ? "bg-navy/[0.06]" : "";
  const filterActive = isSeeker
    ? "bg-marigold/20 text-[#8a5a10]"
    : isEmployerPro
      ? "bg-ink text-white"
      : "bg-teal/15 text-teal";
  const filterIdle = "bg-ink/[0.04] text-ink/50 hover:bg-ink/8 hover:text-ink/70";
  const avatarBg = isSeeker ? "bg-navy/10 text-navy" : isEmployerPro ? "bg-ink/10 text-ink" : "bg-teal/10 text-teal";
  const unreadBadge = isSeeker ? "bg-marigold text-ink" : isEmployerPro ? "bg-ink text-white" : "bg-teal text-white";
  const mineBubble = isSeeker ? "bg-navy text-mist" : isEmployerPro ? "bg-ink text-mist" : "bg-teal text-white";
  const minePending = isSeeker
    ? "bg-navy/75 text-mist"
    : isEmployerPro
      ? "bg-ink/75 text-mist"
      : "bg-teal/75 text-white";
  const theirsBubble = isSeeker
    ? "border border-navy/10 bg-navy/[0.05] text-ink"
    : "border border-ink/8 bg-white text-ink";
  const sendBtn = isSeeker
    ? "bg-navy text-mist hover:bg-navy/90"
    : isEmployerPro
      ? "bg-marigold text-ink hover:bg-marigold/90"
      : "bg-teal text-white hover:bg-teal/95";
  const composerWrap = isSeeker
    ? "flex items-center gap-2 rounded-full border border-navy/10 bg-navy/[0.04] py-1.5 pl-2 pr-1.5 transition focus-within:border-navy/25 focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/10"
    : isEmployerPro
      ? "flex items-center gap-2 rounded-full border border-ink/10 bg-white px-2 py-1.5 transition focus-within:border-ink/25 focus-within:ring-2 focus-within:ring-ink/10"
      : "flex items-center gap-2 rounded-xl border border-ink/8 bg-ink/[0.02] px-2 py-1.5 transition focus-within:border-teal/30 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal/10";

  function conversationRowClass(convId: string) {
    const active = activeId === convId;
    if (isSeeker) {
      return `flex w-full cursor-pointer gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-ink/[0.03] animate-slide-up sm:px-4 ${
        active ? activeRow : ""
      }`;
    }
    return `flex w-full cursor-pointer gap-3 border-l-2 px-3 py-2.5 text-left transition-colors duration-200 sm:px-4 ${
      active
        ? isEmployerPro
          ? "border-marigold bg-marigold/[0.08]"
          : "border-teal bg-teal/[0.04]"
        : "border-transparent hover:bg-ink/[0.03]"
    }`;
  }

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
        const peer = role === "EMPLOYER" ? c.seeker.fullName : c.company.companyName;
        const job = c.job?.title ?? "";
        const preview = c.lastMessage?.body ?? "";
        return (
          peer.toLowerCase().includes(q) ||
          job.toLowerCase().includes(q) ||
          preview.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [conversations, listFilter, searchQuery, role]);

  function selectConversation(id: string) {
    setAiToneMenuOpen(false);
    router.push(`${basePath}/messages?c=${id}`);
  }

  function peerLabel(conv: Conversation) {
    return role === "EMPLOYER" ? conv.seeker.fullName : conv.company.companyName;
  }

  function threadPeerLabel() {
    if (!thread) return "";
    return role === "EMPLOYER" ? thread.seeker.fullName : thread.company.companyName;
  }

  function threadPeerLogo() {
    if (!thread) return null;
    return role === "SEEKER" ? thread.company.logoUrl : thread.seeker.photoUrl ?? null;
  }

  function listPeerPhoto(conv: Conversation) {
    return role === "SEEKER" ? conv.company.logoUrl : conv.seeker.photoUrl;
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

  const filters: { id: ListFilter; label: string; count?: number }[] = isSeeker
    ? [
        { id: "ALL", label: "All" },
        { id: "UNREAD", label: "Unread" },
        { id: "INTERVIEWS", label: "Interviews" },
      ]
    : [
        { id: "ALL", label: "All", count: conversations.length },
        { id: "UNREAD", label: "Unread", count: unreadTotal },
        { id: "INTERVIEWS", label: "Interviews", count: interviewCount },
        { id: "HIRED", label: "Hired", count: hiredCount },
      ];

  const activeBandLabel = useMemo(() => {
    if (!activeId) return null;
    if (thread) {
      return role === "EMPLOYER" ? thread.seeker.fullName : thread.company.companyName;
    }
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return null;
    return role === "EMPLOYER" ? conv.seeker.fullName : conv.company.companyName;
  }, [activeId, thread, conversations, role]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  return (
    <div
      className={`animate-fade-in flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white`}
    >
      {fillNavClearance && (
        <MessagesNavBand unreadCount={unreadTotal} activeLabel={activeBandLabel} />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      {/* ── Sidebar ── */}
      <aside
        className={`flex w-full flex-col border-ink/8 lg:shrink-0 lg:border-r ${
          isSeeker ? "bg-mist/40 lg:w-[min(320px,34%)] lg:max-w-[380px]" : "bg-white lg:w-[300px] lg:max-w-[340px]"
        } ${activeId ? "hidden lg:flex" : "flex"}`}
      >
        <div
          className={`shrink-0 border-b border-ink/8 ${isSeeker ? "px-6 py-5 sm:px-8" : "px-4 py-3 sm:px-5"}`}
        >
          {isSeeker ? (
            <div className={fillNavClearance ? "hidden lg:block" : undefined}>
              <h1 className="font-display text-2xl font-bold text-ink">Messages</h1>
              <p className="mt-0.5 text-sm text-ink/45">In-platform conversations</p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-black tracking-tighter text-ink">Inbox</h2>
              {unreadTotal > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 font-data text-xs font-bold tabular-nums ${
                    isEmployerPro ? "bg-ink text-white" : "bg-teal/15 text-teal"
                  }`}
                >
                  {unreadTotal} unread
                </span>
              )}
            </div>
          )}

          <div
            className={`flex flex-col gap-3 ${
              isSeeker ? (fillNavClearance ? "mt-3 lg:mt-4" : "mt-4") : "mt-3"
            }`}
          >
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setListFilter(f.id)}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                    listFilter === f.id ? filterActive : filterIdle
                  }`}
                >
                  {f.label}
                  {f.count !== undefined && (
                    <span className={`ml-1.5 font-data tabular-nums ${listFilter === f.id ? "opacity-70" : "text-ink/35"}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <label className="relative block w-full">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSeeker ? "Search conversations..." : "Search name, job, or message…"}
                className={`w-full rounded-xl border border-ink/8 py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:bg-white ${
                  isSeeker
                    ? "bg-ink/[0.03] focus:border-navy/25"
                    : isEmployerPro
                      ? "bg-ink/[0.03] focus:border-ink/25 focus:ring-2 focus:ring-ink/10"
                      : "bg-white/80 focus:border-teal/30 focus:ring-2 focus:ring-teal/10"
                }`}
              />
            </label>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto ${isSeeker ? "px-4 py-2 sm:px-5" : "divide-y divide-ink/5 px-0 py-0"}`}>
          {listError && <p className="p-4 text-sm text-ember">{listError}</p>}

          {!loadingList && filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-slide-up">
              <MessageSquare className="mb-3 h-8 w-8 text-ink/20" />
              <p className="text-sm font-medium text-ink/60">
                {searchQuery || listFilter !== "ALL"
                  ? "No matching conversations"
                  : "No conversations yet"}
              </p>
              <p className="mt-1 text-xs text-ink/40">
                {role === "EMPLOYER"
                  ? "Message a candidate from Applicants or Talent — threads show up here."
                  : "Employers will appear here when they message you."}
              </p>
              {isSeeker && !searchQuery && listFilter === "ALL" && (
                <Link
                  href="/jobs"
                  className="mt-4 cursor-pointer rounded-xl bg-marigold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-marigold/90"
                >
                  Browse jobs
                </Link>
              )}
              {!isSeeker && !searchQuery && listFilter === "ALL" && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/employer/applicants"
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      isEmployerPro
                        ? "bg-marigold text-ink hover:bg-marigold/90"
                        : "bg-teal text-white hover:bg-teal/95"
                    }`}
                  >
                    Review applicants
                  </Link>
                  <Link
                    href="/employer/talent"
                    className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/[0.02]"
                  >
                    Browse talent
                  </Link>
                </div>
              )}
            </div>
          )}

          {filteredConversations.map((conv, idx) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => selectConversation(conv.id)}
              style={isSeeker ? { animationDelay: `${idx * 40}ms` } : undefined}
              className={conversationRowClass(conv.id)}
            >
              <div className="relative shrink-0">
                <PeerAvatar
                  label={peerLabel(conv)}
                  logoUrl={listPeerPhoto(conv)}
                  avatarClass={avatarBg}
                  size="md"
                />
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
                {conv.lastMessage && (
                  <p className="mt-0.5 truncate text-xs text-ink/50">{conv.lastMessage.body}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {conv.applicationStatus && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusBadgeClass(conv.applicationStatus, isSeeker)}`}
                    >
                      {conv.applicationStatus.replace(/_/g, " ")}
                    </span>
                  )}
                  {conv.job && (
                    <span className="truncate rounded-full bg-ink/6 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink/45">
                      {conv.job.title}
                    </span>
                  )}
                </div>
              </div>

              {conv.unreadCount > 0 && (
                <span
                  className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${unreadBadge}`}
                >
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Thread panel ── */}
      <section
        className={`flex min-h-0 flex-1 flex-col ${
          !activeId ? (isSeeker ? "bg-white" : "bg-mist/20") : "bg-white"
        } ${!activeId ? "hidden lg:flex" : "flex"}`}
      >
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-fade-in">
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                isSeeker ? "bg-ink/[0.04]" : "bg-white shadow-sm ring-1 ring-ink/5"
              }`}
            >
              <MessageSquare className="h-8 w-8 text-ink/20" />
            </div>
            <p className="font-display text-base font-semibold text-ink/55">Select a conversation</p>
            <p className="mt-1 max-w-xs text-sm text-ink/35">
              {isSeeker
                ? "Pick a thread from the list to read and reply."
                : "Choose a candidate from your inbox, or start a thread from Applicants or Talent."}
            </p>
            {!isSeeker && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                  href="/employer/applicants"
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    isEmployerPro
                      ? "bg-marigold text-ink hover:bg-marigold/90"
                      : "bg-teal text-white hover:bg-teal/95"
                  }`}
                >
                  Applicants
                </Link>
                <Link
                  href="/employer/talent"
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/[0.02]"
                >
                  Talent
                </Link>
              </div>
            )}
          </div>
        ) : loadingThread || !thread ? (
          <div className="flex flex-1 items-center justify-center text-sm text-ink/45">
            {threadError || "Loading conversation..."}
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className={`flex shrink-0 items-center justify-between gap-3 border-b border-ink/8 px-4 sm:px-6 ${isSeeker ? "py-3.5" : "py-2.5"}`}>
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className={`shrink-0 cursor-pointer text-xs font-semibold lg:hidden ${
                    isSeeker ? "text-marigold" : isEmployerPro ? "text-[#9A5B12]" : "text-teal"
                  }`}
                  onClick={() => router.push(`${basePath}/messages`)}
                >
                  ← Back
                </button>

                <PeerAvatar
                  label={threadPeerLabel()}
                  logoUrl={threadPeerLogo()}
                  avatarClass={avatarBg}
                  size="lg"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isSeeker ? (
                      <Link
                        href={`/companies/${thread.company.id}`}
                        className="truncate font-display text-base font-bold text-ink transition hover:text-navy"
                      >
                        {threadPeerLabel()}
                      </Link>
                    ) : (
                      <h2 className="truncate font-display text-base font-bold text-ink">
                        {threadPeerLabel()}
                      </h2>
                    )}
                    {isSeeker && (
                      <BadgeCheck
                        className="h-4 w-4 shrink-0 text-marigold"
                        aria-label="Verified employer"
                      />
                    )}
                  </div>
                  <p className="truncate text-xs text-ink/45">
                    {role === "SEEKER" ? "Hiring team" : thread.seeker.headline || "Virtual Assistant"}
                    {thread.job && (
                      <>
                        {" · Role: "}
                        <Link
                          href={`/jobs/${thread.job.id}`}
                          className="font-medium text-ink/55 transition hover:text-navy"
                        >
                          {thread.job.title}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!isSeeker && thread.job && (
                  <Link
                    href={`/employer/jobs/${thread.job.id}/applicants`}
                    className={`hidden cursor-pointer rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/65 transition sm:inline-flex ${
                      isEmployerPro ? "hover:border-ink/20 hover:text-ink" : "hover:border-teal/25 hover:text-teal"
                    }`}
                  >
                    View pipeline
                  </Link>
                )}
                {!isSeeker && (
                  <Link
                    href={`/employer/talent/${thread.seeker.id}`}
                    className={`hidden cursor-pointer rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/65 transition sm:inline-flex ${
                      isEmployerPro ? "hover:border-ink/20 hover:text-ink" : "hover:border-teal/25 hover:text-teal"
                    }`}
                  >
                    View profile
                  </Link>
                )}
                {thread.job && isSeeker && (
                  <Link
                    href={`/jobs/${thread.job.id}`}
                    className="hidden cursor-pointer rounded-full border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/65 transition hover:border-navy/30 hover:text-navy sm:inline-flex"
                  >
                    View application
                  </Link>
                )}
                {isSeeker && (
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/40 transition hover:bg-ink/5 hover:text-ink/65"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {!isSeeker && (activeConversation?.applicationStatus || thread.job) && (
              <div className={`flex shrink-0 flex-wrap items-center gap-2 border-b border-ink/5 px-4 sm:px-6 ${isSeeker ? "bg-mist/30 py-2" : "bg-mist/20 py-1.5"}`}>
                {activeConversation?.applicationStatus && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusBadgeClass(activeConversation.applicationStatus, false)}`}
                  >
                    {activeConversation.applicationStatus.replace(/_/g, " ")}
                  </span>
                )}
                {thread.job && (
                  <span className="truncate text-xs text-ink/45">
                    Re:{" "}
                    <Link
                      href={`/employer/jobs/${thread.job.id}/applicants`}
                      className={`font-medium text-ink/60 transition ${
                        isEmployerPro ? "hover:text-[#9A5B12]" : "hover:text-teal"
                      }`}
                    >
                      {thread.job.title}
                    </Link>
                  </span>
                )}
              </div>
            )}

            {/* Messages */}
            <div
              className={`min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 ${
                isSeeker ? "space-y-4 py-5" : "py-3"
              }`}
              aria-live="polite"
              aria-relevant="additions"
            >
              {thread.messages.map((msg, idx) => {
                const prev = thread.messages[idx - 1];
                const next = thread.messages[idx + 1];
                const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);
                const isGroupStart = !prev || prev.isMine !== msg.isMine || showDate;
                const showMeta =
                  !next || next.isMine !== msg.isMine || !sameDay(msg.createdAt, next.createdAt);
                const showIncomingAvatar = !msg.isMine && isGroupStart;

                return (
                  <div key={msg.id} className={showDate ? "mt-3 first:mt-0" : isGroupStart ? "mt-2.5" : "mt-0.5"}>
                    {showDate && (
                      <div className="mb-2 flex justify-center">
                        <span className="rounded-full bg-ink/[0.05] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink/50">
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex items-end gap-2 ${
                        msg.isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!msg.isMine &&
                        (showIncomingAvatar ? (
                          <PeerAvatar
                            label={threadPeerLabel()}
                            logoUrl={threadPeerLogo()}
                            avatarClass={avatarBg}
                            size="sm"
                          />
                        ) : (
                          <span className="inline-block h-8 w-8 shrink-0" aria-hidden="true" />
                        ))}

                      <div className={`${isSeeker ? "max-w-[min(78%,40rem)]" : "max-w-[min(86%,56rem)]"} ${msg.isMine ? "order-first" : ""}`}>
                        <div
                          className={`px-3.5 py-2 text-sm leading-snug ${
                            isSeeker ? "rounded-2xl py-2.5 leading-relaxed" : "rounded-2xl"
                          } ${
                            msg.isMine
                              ? msg.pending
                                ? `${minePending} rounded-br-sm`
                                : `${mineBubble} rounded-br-sm`
                              : `${theirsBubble} rounded-bl-sm`
                          }`}
                        >
                          <p>{msg.body}</p>
                        </div>
                        {showMeta && (
                          <div
                            className={`mt-0.5 flex items-center gap-1 px-1 ${
                              msg.isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="font-data text-[10px] text-ink/35">
                              {msg.pending ? "Sending…" : formatTime(msg.createdAt)}
                            </span>
                            {msg.isMine && !msg.pending && msg.readAt && (
                              <CheckCheck className="h-3 w-3 text-navy/50" aria-label="Read" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Composer — extra right padding keeps clear of any fixed UI; search pill hidden on this route */}
            <form
              onSubmit={handleSend}
              className={`shrink-0 border-t border-ink/8 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] ${
                isSeeker
                  ? "px-4 py-3 sm:px-6"
                  : "bg-white px-4 py-2 shadow-[0_-4px_12px_rgba(32,36,43,0.04)] sm:px-5"
              }`}
            >
              {sendError && <p className="mb-2 text-xs text-ember">{sendError}</p>}
              {!isSeeker && isPro && thread.job && (
                <div className="relative mb-2 inline-block">
                  <button
                    ref={aiToneButtonRef}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={aiToneMenuOpen}
                    aria-controls={aiToneMenuOpen ? "message-ai-tone-menu" : undefined}
                    onClick={() => setAiToneMenuOpen((prev) => !prev)}
                    disabled={aiDrafting}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isEmployerPro
                        ? "border border-marigold/30 bg-marigold/12 text-[#9A5B12] hover:bg-marigold/18"
                        : "border border-teal/20 bg-teal/[0.06] text-teal hover:bg-teal/10"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                    {aiDrafting ? "Drafting…" : "Draft with Easy AI"}
                    <ChevronDown className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  {aiToneMenuOpen && (
                    <div
                      id="message-ai-tone-menu"
                      ref={aiToneMenuRef}
                      role="menu"
                      aria-label="Easy AI outreach draft tone"
                      className="absolute bottom-full left-0 z-10 mb-1.5 w-48 rounded-xl border border-ink/8 bg-white p-1.5 shadow-lg shadow-ink/10"
                    >
                      {AI_DRAFT_TONES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          role="menuitem"
                          onClick={() => handleAiDraft(t.value)}
                          className={`block w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-ink/70 transition ${
                            isEmployerPro
                              ? "hover:bg-marigold/10 hover:text-[#9A5B12]"
                              : "hover:bg-teal/8 hover:text-teal"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className={composerWrap}>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/35 transition hover:bg-ink/5 hover:text-ink/55"
                  aria-label="Attach file"
                  disabled
                  title="Attachments coming soon"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <label htmlFor="message-draft" className="sr-only">
                  Message
                </label>
                <input
                  id="message-draft"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  aria-label="Type a message"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink outline-none placeholder:text-ink/35"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${sendBtn} ${
                    !isSeeker ? "rounded-lg" : ""
                  }`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {isSeeker && (
                <p className="mt-2 hidden text-[11px] text-ink/30 sm:block">
                  Enter to send · Ctrl+K still opens global search
                </p>
              )}
            </form>
          </>
        )}
      </section>
      </div>
    </div>
  );
}
