"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import RecruiterShell from "@/components/hiring/RecruiterShell";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";

type ConversationListItem = {
  id: string;
  lastMessageAt: string;
  job: { id: string; title: string } | null;
  seeker: { id: string; fullName: string; headline: string | null; photoUrl: string | null };
  lastMessage: { body: string; createdAt: string } | null;
  unreadCount: number;
};

type ThreadMessage = { id: string; body: string; createdAt: string; isMine: boolean };
type Thread = { id: string; job: { id: string; title: string } | null; seeker: { id: string; fullName: string; headline: string | null; photoUrl: string | null }; messages: ThreadMessage[] };

const LIST_POLL_MS = 4000;
const THREAD_POLL_MS = 2500;

export default function CollaboratorMessagesInbox({ companyId, role }: { companyId: string; role: CompanyMemberRole }) {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

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

  useEffect(() => { void loadConversations(); }, [loadConversations]);
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

  useEffect(() => {
    if (!activeId) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/hiring/${companyId}/conversations/${activeId}/messages${lastMessageIdRef.current ? `?after=${lastMessageIdRef.current}` : ""}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: ThreadMessage[] = data.messages ?? [];
      if (!incoming.length || activeIdRef.current !== activeId) return;
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, ...incoming] } : prev));
      lastMessageIdRef.current = incoming.at(-1)?.id ?? lastMessageIdRef.current;
    }, THREAD_POLL_MS);
    return () => clearInterval(id);
  }, [activeId, companyId]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!activeId || !draft.trim() || sending) return;
    const body = draft.trim();
    setSending(true);
    setDraft("");
    try {
      const res = await fetch(`/api/hiring/${companyId}/conversations/${activeId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Could not send message."); setDraft(body); return; }
      const message: ThreadMessage = result.message;
      setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
      lastMessageIdRef.current = message.id;
      void loadConversations(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <RecruiterShell companyId={companyId} role={role} active="messages">
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className={`flex w-full shrink-0 flex-col border-ink/8 bg-white lg:w-[300px] lg:border-r ${activeId ? "hidden lg:flex" : "flex"}`}>
            <div className="border-b border-ink/8 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9A5B12]">Hiring workspace</p>
              <h1 className="mt-1 font-display text-lg font-black text-ink">Messages</h1>
              <p className="mt-0.5 text-xs text-ink/45">Candidate conversations across your roles.</p>
            </div>
            <div className="flex-1 divide-y divide-ink/5 overflow-y-auto">
              {loadingList && !conversations.length && <p className="p-5 text-sm text-ink/45">Loading…</p>}
              {!loadingList && !conversations.length && (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-marigold/10 text-[#9A5B12]">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-ink/70">No conversations yet</p>
                  <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-ink/40">Message a candidate from a candidate review — threads show up here.</p>
                </div>
              )}
              {conversations.map((c) => (
                <button key={c.id} type="button" onClick={() => openConversation(c.id)} className={`flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-3 text-left transition ${activeId === c.id ? "border-marigold bg-marigold/[0.08]" : "border-transparent hover:bg-ink/[0.03]"}`}>
                  <EmployerAvatar name={c.seeker.fullName} imageUrl={c.seeker.photoUrl} size="md" shape="circle" fallbackClassName="bg-ink/10 text-ink" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${c.unreadCount ? "font-bold text-ink" : "font-semibold text-ink"}`}>{c.seeker.fullName}</span>
                      <span className="shrink-0 font-data text-[10px] text-ink/40">{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                    </div>
                    {c.lastMessage && <p className="mt-0.5 truncate text-xs text-ink/50">{c.lastMessage.body}</p>}
                    {c.job && <span className="mt-1 inline-block truncate rounded-full bg-ink/[0.05] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink/45">{c.job.title}</span>}
                  </div>
                  {c.unreadCount > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-white">{c.unreadCount}</span>}
                </button>
              ))}
            </div>
          </aside>

          <section className={`flex min-h-0 flex-1 flex-col bg-mist/20 ${!activeId ? "hidden lg:flex" : "flex"}`}>
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
                <div className="flex shrink-0 items-center gap-3 border-b border-ink/8 bg-white px-5 py-3">
                  <button type="button" className="cursor-pointer text-xs font-semibold text-[#9A5B12] lg:hidden" onClick={() => { setActiveId(null); activeIdRef.current = null; }}>← Back</button>
                  <EmployerAvatar name={thread.seeker.fullName} imageUrl={thread.seeker.photoUrl} size="md" shape="circle" fallbackClassName="bg-ink/10 text-ink" />
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-bold text-ink">{thread.seeker.fullName}</h2>
                    <p className="truncate text-xs text-ink/45">{thread.seeker.headline || "Virtual Assistant"}{thread.job && ` · ${thread.job.title}`}</p>
                  </div>
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
                  {thread.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${message.isMine ? "rounded-br-sm bg-ink text-mist" : "rounded-bl-sm border border-ink/8 bg-white text-ink"}`}>
                        <p>{message.body}</p>
                        <p className={`mt-0.5 text-[10px] ${message.isMine ? "text-mist/60" : "text-ink/35"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-ink/8 bg-white px-4 py-3">
                  <input type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message…" className="min-w-0 flex-1 rounded-full border border-ink/10 bg-mist/40 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink/25 focus:bg-white focus:ring-2 focus:ring-ink/10" />
                  <button type="submit" disabled={!draft.trim() || sending} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-marigold text-ink transition hover:bg-marigold/90 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
                </form>
              </>
            )}
          </section>
        </div>
    </RecruiterShell>
  );
}
