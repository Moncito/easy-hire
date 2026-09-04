import { prisma } from "@/lib/prisma";
import { isDiscoverableInTalentSearch } from "@/lib/seeker-profile-format";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { createNotification, sendNewMessageEmail } from "@/lib/email";
import { shouldSendNewMessageEmail } from "@/lib/messaging/message-notify";
import { invalidateEmployerNav } from "@/lib/employer-cache";
import { invalidateConversationsForParticipants } from "@/lib/conversations-cache";
import { stampFirstEmployerResponseForMessage } from "@/lib/employer/response-metrics";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { requireSeekerProfile } from "@/lib/seeker-auth";
import { requireVerifiedEmail } from "@/lib/auth/credentials-recovery";
import { companyMemberRoleLabel } from "@/lib/collaborative-hiring";
import {
  conversationCreateSchema,
  messageCreateSchema,
  type ConversationCreate,
} from "@/lib/validations/message";

export type { ConversationListItem } from "@/lib/conversation-inbox";

function invalidateInboxForConversation(conversation: {
  company: { userId: string };
  seeker: { userId: string };
}) {
  invalidateConversationsForParticipants(conversation.company.userId, conversation.seeker.userId);
}

const conversationParties = {
  company: { select: { id: true, userId: true, companyName: true, logoUrl: true } },
  seeker: { select: { id: true, userId: true, fullName: true, headline: true, photoUrl: true } },
  job: { select: { id: true, title: true } },
} as const;

type ConversationWithParties = {
  company: { userId: string };
  seeker: { userId: string };
};

/** Pure authorization check — no DB access; the conversation is already loaded. */
function assertConversationAccess<T extends ConversationWithParties>(
  conversation: T | null,
  userId: string,
  role: string
): asserts conversation is T {
  if (!conversation) throw new ApiError("Conversation not found", 404);
  if (role !== "EMPLOYER" && role !== "SEEKER") throw new ApiError("Forbidden", 403);
  if (role === "EMPLOYER" && conversation.company.userId !== userId) throw new ApiError("Forbidden", 403);
  // The conversation already carries the seeker's userId — compare directly
  // instead of a second round-trip to look the profile up by userId.
  if (role === "SEEKER" && conversation.seeker.userId !== userId) throw new ApiError("Forbidden", 403);
}

export async function requireConversationAccess(userId: string, role: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    relationLoadStrategy: "join",
    include: conversationParties,
  });
  assertConversationAccess(conversation, userId, role);
  return conversation;
}

/**
 * Employer-side conversations may now carry messages from more than one real
 * account (the owner, or — via Collaborative Hiring — a recruiter/teammate),
 * all sharing the same Conversation row. `isMine` alone can't tell the UI who
 * actually sent a message it didn't send; `senderKind`/`senderLabel` let the
 * renderer distinguish "the candidate replied" from "a teammate sent this on
 * the company's behalf" instead of defaulting every non-mine message to the
 * seeker's identity.
 */
export async function annotateSenders<T extends { senderUserId: string }>(
  messages: T[],
  userId: string,
  seekerUserId: string,
  companyId: string,
  companyOwnerUserId?: string
): Promise<
  (T & {
    isMine: boolean;
    senderKind: "SEEKER" | "EMPLOYER";
    senderLabel: string | null;
    senderPhotoUrl: string | null;
    senderRoleLabel: string | null;
  })[]
> {
  const otherSenderIds = [...new Set(messages.map((m) => m.senderUserId).filter((id) => id !== userId && id !== seekerUserId))];
  const senders = otherSenderIds.length
    ? await prisma.user.findMany({
        where: { id: { in: otherSenderIds } },
        select: { id: true, email: true, avatarUrl: true, companyMemberships: { where: { companyId, status: "ACTIVE" }, select: { role: true }, take: 1 } },
      })
    : [];
  const byId = new Map(senders.map((s) => [s.id, s]));

  return messages.map((m) => {
    const isMine = m.senderUserId === userId;
    const senderKind: "SEEKER" | "EMPLOYER" = m.senderUserId === seekerUserId ? "SEEKER" : "EMPLOYER";
    const sender = isMine || senderKind === "SEEKER" ? undefined : byId.get(m.senderUserId);
    return {
      ...m,
      isMine,
      senderKind,
      senderLabel: sender?.email ?? null,
      senderPhotoUrl: sender?.avatarUrl ?? null,
      senderRoleLabel: sender?.companyMemberships[0]
        ? companyMemberRoleLabel(sender.companyMemberships[0].role)
        : sender && companyOwnerUserId && m.senderUserId === companyOwnerUserId
          ? "Owner"
          : null,
    };
  });
}

export async function getConversationThread(userId: string, role: string, conversationId: string) {
  // One SQL JOIN for conversation + parties + messages; authorize after.
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    relationLoadStrategy: "join",
    include: {
      ...conversationParties,
      // Hard ceiling on initial thread load, not real pagination — a
      // pathologically long thread (thousands of messages) must not blow up
      // a single request. Fetch the latest 300 descending, then reverse in
      // JS so the returned shape/order (ascending) is unchanged. Follow-up:
      // replace with real cursor-based pagination for message history.
      messages: {
        orderBy: { createdAt: "desc" },
        take: 300,
        select: { id: true, body: true, createdAt: true, senderUserId: true, readAt: true },
      },
    },
  });
  assertConversationAccess(conversation, userId, role);
  const messages = [...conversation.messages].reverse();

  // Fire-and-forget read receipt — never block the thread response on it.
  void prisma.message
    .updateMany({ where: { conversationId, senderUserId: { not: userId }, readAt: null }, data: { readAt: new Date() } })
    .then((res) => { if (res.count > 0) invalidateInboxForConversation(conversation); })
    .catch((err) => console.error("[messages] mark-read failed:", err));

  const annotated = await annotateSenders(messages, userId, conversation.seeker.userId, conversation.company.id, conversation.company.userId);
  return {
    id: conversation.id,
    job: conversation.job,
    company: conversation.company,
    seeker: conversation.seeker,
    messages: annotated.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
      senderUserId: m.senderUserId,
      isMine: m.isMine,
      senderKind: m.senderKind,
      senderLabel: m.senderLabel,
      senderPhotoUrl: m.senderPhotoUrl,
      senderRoleLabel: m.senderRoleLabel,
    })),
  };
}

export async function getMessagesAfter(
  userId: string,
  role: string,
  conversationId: string,
  afterMessageId?: string
) {
  // Poll path — hit every few seconds. Access check, parties, and cursor all
  // resolve together, then one "messages after" read.
  const [conversation, cursor] = await Promise.all([
    prisma.conversation.findUnique({ where: { id: conversationId }, relationLoadStrategy: "join", include: conversationParties }),
    afterMessageId
      ? prisma.message.findFirst({ where: { id: afterMessageId, conversationId }, select: { createdAt: true, id: true } })
      : Promise.resolve(null),
  ]);
  assertConversationAccess(conversation, userId, role);

  let messages;
  if (afterMessageId) {
    messages = cursor
      ? await prisma.message.findMany({
          where: {
            conversationId,
            OR: [
              { createdAt: { gt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { gt: cursor.id } },
            ],
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            body: true,
            createdAt: true,
            senderUserId: true,
          },
        })
      : [];
  } else {
    // No cursor yet — this only fires when a client polls before its first
    // getConversationThread load, so it should be rare in practice. Same
    // hard ceiling as getConversationThread above: latest 300, reversed, for
    // safety on a pathologically long thread. Not real pagination.
    const latest = await prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 300,
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderUserId: true,
      },
    });
    messages = latest.reverse();
  }

  if (messages.some((m) => m.senderUserId !== userId)) {
    void prisma.message
      .updateMany({ where: { conversationId, senderUserId: { not: userId }, readAt: null }, data: { readAt: new Date() } })
      .then((res) => { if (res.count > 0) invalidateInboxForConversation(conversation); })
      .catch((err) => console.error("[messages] mark-read failed:", err));
  }

  const annotated = await annotateSenders(messages, userId, conversation.seeker.userId, conversation.company.id, conversation.company.userId);
  return annotated.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    senderUserId: m.senderUserId,
    isMine: m.isMine,
    senderKind: m.senderKind,
    senderLabel: m.senderLabel,
    senderPhotoUrl: m.senderPhotoUrl,
    senderRoleLabel: m.senderRoleLabel,
  }));
}

const conversationInclude = {
  company: { select: { id: true, companyName: true, logoUrl: true } },
  seeker: { select: { id: true, fullName: true, headline: true, photoUrl: true } },
  job: { select: { id: true, title: true } },
} as const;

/**
 * A seeker may only open a thread with a company they have an `Application`
 * to — otherwise this endpoint would be a spam vector for cold-messaging any
 * company on the platform. `appliedJobIds` must already be scoped to the
 * target company (see the caller): that single scoping also makes "the job
 * belongs to a different company" fall out for free, since such a job's id
 * would never appear in the list.
 *
 * Pure — no DB access — so it's unit-testable without mocking Prisma.
 */
export function seekerCanMessageCompany(appliedJobIds: string[], jobId?: string | null): boolean {
  if (jobId) {
    return appliedJobIds.includes(jobId);
  }
  return appliedJobIds.length > 0;
}

export const SEEKER_MESSAGE_ACCESS_DENIED = "You can only message companies you've applied to.";

type UpsertConversationArgs = {
  companyId: string;
  companyUserId: string;
  seekerId: string;
  seekerUserId: string;
  jobId: string | null;
  initialMessage?: string;
  senderUserId: string;
  senderRole: "EMPLOYER" | "SEEKER";
};

/** Shared create-or-get semantics for both the employer- and seeker-initiated paths. */
async function upsertConversation(args: UpsertConversationArgs) {
  const { companyId, companyUserId, seekerId, seekerUserId, jobId, initialMessage, senderUserId, senderRole } = args;

  let conversation = await prisma.conversation.findUnique({
    where: { companyId_seekerId: { companyId, seekerId } },
    include: conversationInclude,
  });

  if (!conversation) {
    try {
      conversation = await prisma.conversation.create({
        data: { companyId, seekerId, jobId },
        include: conversationInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        conversation = await prisma.conversation.findUnique({
          where: { companyId_seekerId: { companyId, seekerId } },
          include: conversationInclude,
        });
      } else {
        throw error;
      }
    }
  }

  if (!conversation) {
    throw new ApiError("Could not create conversation", 500);
  }

  if (jobId && !conversation.jobId) {
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { jobId },
      include: conversationInclude,
    });
  }

  if (initialMessage) {
    await sendMessage(senderUserId, senderRole, conversation.id, { body: initialMessage });
  } else {
    invalidateConversationsForParticipants(companyUserId, seekerUserId);
  }

  return conversation;
}

async function createOrGetConversationAsEmployer(employerUserId: string, input: ConversationCreate) {
  if (!input.seekerId) {
    throw new ApiError("seekerId is required", 400);
  }

  const company = await requireEmployerCompany(employerUserId);

  const seeker = await prisma.seekerProfile.findUnique({
    where: { id: input.seekerId },
    include: { user: { select: { id: true } } },
  });

  if (!seeker) {
    throw new ApiError("Seeker not found", 404);
  }

  if (!isDiscoverableInTalentSearch(seeker.visibility)) {
    throw new ApiError("This seeker profile is not visible", 403);
  }

  if (input.jobId) {
    const job = await prisma.job.findFirst({
      where: { id: input.jobId, companyId: company.id },
    });
    if (!job) {
      throw new ApiError("Job not found", 404);
    }
  }

  return upsertConversation({
    companyId: company.id,
    companyUserId: employerUserId,
    seekerId: seeker.id,
    seekerUserId: seeker.user.id,
    jobId: input.jobId ?? null,
    initialMessage: input.initialMessage,
    senderUserId: employerUserId,
    senderRole: "EMPLOYER",
  });
}

/**
 * Scoping rule mirrors `getSeekerProfileForEmployer` in lib/employer/talent.ts
 * (the employer side's "has this seeker applied to one of my jobs" check):
 * a seeker may only open a conversation with a company they have an
 * `Application` to. Fetching applications pre-scoped to `input.companyId`
 * means a nonexistent company and "never applied" both resolve to the same
 * generic 403 — we never confirm or deny that a company exists.
 */
async function createOrGetConversationAsSeeker(seekerUserId: string, input: ConversationCreate) {
  if (!input.companyId) {
    throw new ApiError("companyId is required", 400);
  }

  const seeker = await requireSeekerProfile(seekerUserId);

  const appliedJobIds = (
    await prisma.application.findMany({
      where: { seekerId: seeker.id, job: { companyId: input.companyId } },
      select: { jobId: true },
    })
  ).map((application) => application.jobId);

  if (!seekerCanMessageCompany(appliedJobIds, input.jobId)) {
    throw new ApiError(SEEKER_MESSAGE_ACCESS_DENIED, 403);
  }

  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    select: { id: true, userId: true },
  });

  if (!company) {
    // Defense in depth: in practice appliedJobIds is already empty when the
    // company doesn't exist, since no job can reference it.
    throw new ApiError(SEEKER_MESSAGE_ACCESS_DENIED, 403);
  }

  return upsertConversation({
    companyId: company.id,
    companyUserId: company.userId,
    seekerId: seeker.id,
    seekerUserId,
    jobId: input.jobId ?? null,
    initialMessage: input.initialMessage,
    senderUserId: seekerUserId,
    senderRole: "SEEKER",
  });
}

export async function createOrGetConversation(userId: string, role: string, raw: unknown) {
  const input = conversationCreateSchema.parse(raw);

  if (role === "EMPLOYER") {
    return createOrGetConversationAsEmployer(userId, input);
  }
  if (role === "SEEKER") {
    return createOrGetConversationAsSeeker(userId, input);
  }
  throw new ApiError("Forbidden", 403);
}

export async function sendMessage(
  userId: string,
  role: string,
  conversationId: string,
  raw: unknown
) {
  const input = messageCreateSchema.parse(raw);
  // Sending a message is one of the two gated actions (see requireVerifiedEmail).
  await requireVerifiedEmail(userId);
  const conversation = await requireConversationAccess(userId, role, conversationId);

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderUserId: userId,
      body: input.body,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: message.createdAt },
  });

  const recipientUserId =
    role === "EMPLOYER" ? conversation.seeker.userId : conversation.company.userId;

  if (recipientUserId !== userId) {
    const senderName =
      role === "EMPLOYER" ? conversation.company.companyName : conversation.seeker.fullName;

    // Don't block the HTTP response on notification writes.
    void createNotification(
      recipientUserId,
      "NEW_MESSAGE",
      `${senderName} sent you a message.`
    ).catch((err) => console.error("[messages] notification failed:", err));

    // Throttled email — see lib/messaging/message-notify.ts for the exact
    // rule. Fire-and-forget: neither the unread count nor the mail send may
    // block or fail the message send itself.
    const recipientRole: "SEEKER" | "EMPLOYER" = role === "EMPLOYER" ? "SEEKER" : "EMPLOYER";
    void (async () => {
      const [earlierUnreadCount, recipient] = await Promise.all([
        prisma.message.count({
          where: {
            conversationId,
            senderUserId: { not: recipientUserId },
            readAt: null,
            id: { not: message.id },
          },
        }),
        prisma.user.findUnique({ where: { id: recipientUserId }, select: { email: true } }),
      ]);
      if (!recipient || !shouldSendNewMessageEmail(earlierUnreadCount)) return;
      await sendNewMessageEmail({ to: recipient.email, recipientRole, senderName });
    })().catch((err) => console.error("[messages] new-message email failed:", err));
  }

  if (role === "EMPLOYER") {
    invalidateEmployerNav(conversation.company.id);

    // Site 3 of 3 for Application.firstEmployerResponseAt (see its schema
    // comment): the employer's first message to this seeker. Only an
    // EMPLOYER-role sender may stamp — a seeker's own message must never
    // count as the employer's response.
    await stampFirstEmployerResponseForMessage({
      companyId: conversation.company.id,
      seekerId: conversation.seeker.id,
      jobId: conversation.jobId,
    }).catch((err) => console.error("[messages] response-metric stamp failed:", err));
  }

  invalidateInboxForConversation(conversation);

  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    readAt: null,
    senderUserId: message.senderUserId,
    isMine: true,
    senderKind: (role === "SEEKER" ? "SEEKER" : "EMPLOYER") as "SEEKER" | "EMPLOYER",
    senderLabel: null,
    senderPhotoUrl: null,
    senderRoleLabel: null,
  };
}

export async function markConversationRead(userId: string, role: string, conversationId: string) {
  const conversation = await requireConversationAccess(userId, role, conversationId);

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderUserId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  if (role === "EMPLOYER") {
    invalidateEmployerNav(conversation.company.id);
  }

  invalidateInboxForConversation(conversation);

  return { ok: true };
}
