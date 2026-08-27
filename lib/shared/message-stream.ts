import { getSupabaseAdmin } from "@/lib/supabase";

type RawMessageRow = {
  id: string;
  body: string;
  created_at: string;
  sender_user_id: string;
  read_at: string | null;
};

type AnnotatedShape = {
  isMine: boolean;
  senderKind: "SEEKER" | "EMPLOYER";
  senderLabel: string | null;
  senderPhotoUrl: string | null;
  senderRoleLabel: string | null;
};

type AnnotateFn = (
  messages: { id: string; senderUserId: string }[],
  actorUserId: string,
  seekerUserId: string,
  companyId: string
) => Promise<({ id: string; senderUserId: string } & AnnotatedShape)[]>;

/**
 * Pushes newly-inserted `messages` rows to the browser over SSE as they land
 * in Postgres, instead of the client polling every few seconds. The trust
 * boundary stays exactly where it already is: this only ever runs after the
 * caller's own auth check (requireConversationAccess / requireConversationInCompany)
 * has already verified the viewer belongs in this conversation — the
 * Supabase service-role subscription itself has no independent authorization
 * of its own, it's a relay, not a new access path. Never expose the
 * service-role client or a raw Realtime channel to the browser directly.
 */
export function createMessageStreamResponse(params: {
  conversationId: string;
  actorUserId: string;
  seekerUserId: string;
  companyId: string;
  annotate: AnnotateFn;
  signal: AbortSignal;
}): Response {
  const { conversationId, actorUserId, seekerUserId, companyId, annotate, signal } = params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const supabase = getSupabaseAdmin();

      const channel = supabase
        .channel(`messages-stream:${conversationId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          async (payload) => {
            if (closed) return;
            try {
              const raw = payload.new as RawMessageRow;
              const [annotated] = await annotate([{ id: raw.id, senderUserId: raw.sender_user_id }], actorUserId, seekerUserId, companyId);
              const message = {
                id: raw.id,
                body: raw.body,
                createdAt: new Date(raw.created_at).toISOString(),
                readAt: raw.read_at ? new Date(raw.read_at).toISOString() : null,
                senderUserId: raw.sender_user_id,
                isMine: annotated.isMine,
                senderKind: annotated.senderKind,
                senderLabel: annotated.senderLabel,
                senderPhotoUrl: annotated.senderPhotoUrl,
                senderRoleLabel: annotated.senderRoleLabel,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
            } catch (err) {
              console.error("[message-stream] failed to relay message:", err);
            }
          }
        )
        .subscribe();

      // Keeps intermediary proxies/load balancers from closing an otherwise-idle
      // connection, and lets the client detect a dead stream.
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* controller already closed */
        }
      }, 20000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        void supabase.removeChannel(channel);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
