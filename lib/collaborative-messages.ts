import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { createNotification } from "@/lib/email";
import { invalidateEmployerNav } from "@/lib/employer-cache";
import { invalidateConversationsForParticipants } from "@/lib/conversations-cache";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { conversationCreateSchema, messageCreateSchema } from "@/lib/validations/message";
import type { ConversationListItem } from "@/lib/messages";

/**
 * Recruiter/Owner candidate messaging inside the Collaborative Hiring
 * workspace. Deliberately separate from lib/messaging/messages.ts, whose
 * access checks are hard-wired to the literal company-owner userId — this
 * mirrors that logic scoped by companyId + membership instead, so the
 * owner-only path (app/employer/messages, app/api/conversations) is
 * untouched.
 */

async function requireConversationInCompany(companyId: string, actorUserId: string, conversationId: string) {
  await requireCompanyMembership(companyId, actorUserId, "messages:manage");
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId },
    include: {
      company: { select: { id: true, userId: true, companyName: true, logoUrl: true } },
      seeker: { select: { id: true, userId: true, fullName: true, headline: true, photoUrl: true } },
      job: { select: { id: true, title: true } },
    },
  });
  if (!conversation) throw new ApiError("Conversation not found", 404);
  return conversation;
}

export async function listCollaborativeConversations(companyId: string, actorUserId: string): Promise<ConversationListItem[]> {
  await requireCompanyMembership(companyId, actorUserId, "messages:manage");

  const conversations = await prisma.conversation.findMany({
    where: { companyId },
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      lastMessageAt: true,
      seekerId: true,
      company: { select: { id: true, companyName: true, logoUrl: true } },
      seeker: { select: { id: true, fullName: true, headline: true, photoUrl: true } },
      job: { select: { id: true, title: true } },
    },
  });
  if (conversations.length === 0) return [];

  const conversationIds = conversations.map((c) => c.id);
  const jobIds = [...new Set(conversations.map((c) => c.job?.id).filter((id): id is string => Boolean(id)))];

  const [lastMessages, unreadGroups, applications] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["conversationId"],
      select: { conversationId: true, body: true, createdAt: true, senderUserId: true },
    }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: { conversationId: { in: conversationIds }, senderUserId: { not: actorUserId }, readAt: null },
      _count: { _all: true },
    }),
    jobIds.length > 0
      ? prisma.application.findMany({ where: { jobId: { in: jobIds }, job: { companyId } }, select: { jobId: true, seekerId: true, status: true } })
      : [],
  ]);

  const lastMessageByConv = new Map(lastMessages.map((m) => [m.conversationId, m]));
  const unreadByConv = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]));
  const statusByJobSeeker = Object.fromEntries(applications.map((a) => [`${a.jobId}:${a.seekerId}`, a.status]));

  return conversations.map((c) => {
    const last = lastMessageByConv.get(c.id);
    return {
      id: c.id,
      lastMessageAt: c.lastMessageAt.toISOString(),
      job: c.job,
      company: c.company,
      seeker: c.seeker,
      lastMessage: last ? { body: last.body, createdAt: last.createdAt.toISOString(), senderUserId: last.senderUserId } : null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
      applicationStatus: c.job ? statusByJobSeeker[`${c.job.id}:${c.seekerId}`] ?? null : null,
    };
  });
}

export async function getCollaborativeConversationThread(companyId: string, actorUserId: string, conversationId: string) {
  const conversation = await requireConversationInCompany(companyId, actorUserId, conversationId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, createdAt: true, senderUserId: true, readAt: true },
  });

  await prisma.message.updateMany({
    where: { conversationId, senderUserId: { not: actorUserId }, readAt: null },
    data: { readAt: new Date() },
  });
  invalidateConversationsForParticipants(conversation.company.userId, conversation.seeker.userId);
  invalidateEmployerNav(companyId);

  return {
    id: conversation.id,
    job: conversation.job,
    company: { id: conversation.company.id, companyName: conversation.company.companyName, logoUrl: conversation.company.logoUrl },
    seeker: { id: conversation.seeker.id, fullName: conversation.seeker.fullName, headline: conversation.seeker.headline, photoUrl: conversation.seeker.photoUrl },
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
      senderUserId: m.senderUserId,
      isMine: m.senderUserId === actorUserId,
    })),
  };
}

export async function getCollaborativeMessagesAfter(companyId: string, actorUserId: string, conversationId: string, afterMessageId?: string) {
  const conversation = await requireConversationInCompany(companyId, actorUserId, conversationId);

  let messages;
  if (afterMessageId) {
    const cursor = await prisma.message.findFirst({ where: { id: afterMessageId, conversationId }, select: { createdAt: true, id: true } });
    messages = cursor
      ? await prisma.message.findMany({
          where: { conversationId, OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: cursor.id } }] },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true, body: true, createdAt: true, senderUserId: true },
        })
      : [];
  } else {
    messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, body: true, createdAt: true, senderUserId: true },
    });
  }

  if (messages.some((m) => m.senderUserId !== actorUserId)) {
    await prisma.message.updateMany({ where: { conversationId, senderUserId: { not: actorUserId }, readAt: null }, data: { readAt: new Date() } });
    invalidateConversationsForParticipants(conversation.company.userId, conversation.seeker.userId);
    invalidateEmployerNav(companyId);
  }

  return messages.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt.toISOString(), senderUserId: m.senderUserId, isMine: m.senderUserId === actorUserId }));
}

export async function sendCollaborativeMessage(companyId: string, actorUserId: string, conversationId: string, raw: unknown) {
  const input = messageCreateSchema.parse(raw);
  const conversation = await requireConversationInCompany(companyId, actorUserId, conversationId);

  const message = await prisma.message.create({ data: { conversationId, senderUserId: actorUserId, body: input.body } });
  await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: message.createdAt } });

  void createNotification(conversation.seeker.userId, "NEW_MESSAGE", `${conversation.company.companyName} sent you a message.`).catch((err) =>
    console.error("[collaborative-messages] notification failed:", err)
  );

  invalidateEmployerNav(companyId);
  invalidateConversationsForParticipants(conversation.company.userId, conversation.seeker.userId);

  return { id: message.id, body: message.body, createdAt: message.createdAt.toISOString(), readAt: null, senderUserId: message.senderUserId, isMine: true };
}

export async function createOrGetCollaborativeConversation(companyId: string, actorUserId: string, raw: unknown) {
  await requireCompanyMembership(companyId, actorUserId, "messages:manage");
  const input = conversationCreateSchema.parse(raw);

  const seeker = await prisma.seekerProfile.findUnique({ where: { id: input.seekerId }, select: { id: true } });
  if (!seeker) throw new ApiError("Seeker not found", 404);

  if (input.jobId) {
    const job = await prisma.job.findFirst({ where: { id: input.jobId, companyId }, select: { id: true } });
    if (!job) throw new ApiError("Job not found", 404);
  }

  try {
    return await prisma.conversation.create({ data: { companyId, seekerId: seeker.id, jobId: input.jobId ?? null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.conversation.findUniqueOrThrow({ where: { companyId_seekerId: { companyId, seekerId: seeker.id } } });
    }
    throw error;
  }
}
