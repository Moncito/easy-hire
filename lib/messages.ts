import { prisma } from "@/lib/prisma";
import { Prisma } from "../prisma/gen/client";
import { ApiError } from "@/lib/api-error";
import { createNotification } from "@/lib/email";
import { requireEmployerCompany } from "@/lib/employer-auth";
import {
  conversationCreateSchema,
  messageCreateSchema,
} from "@/lib/validations/message";

type ConversationListItem = {
  id: string;
  lastMessageAt: string;
  job: { id: string; title: string } | null;
  company: { id: string; companyName: string; logoUrl: string | null };
  seeker: { id: string; fullName: string; headline: string | null };
  lastMessage: { body: string; createdAt: string; senderUserId: string } | null;
  unreadCount: number;
};

async function requireConversationAccess(userId: string, role: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      company: { select: { id: true, userId: true, companyName: true, logoUrl: true } },
      seeker: { select: { id: true, userId: true, fullName: true, headline: true } },
      job: { select: { id: true, title: true } },
    },
  });

  if (!conversation) {
    throw new ApiError("Conversation not found", 404);
  }

  if (role !== "EMPLOYER" && role !== "SEEKER") {
    throw new ApiError("Forbidden", 403);
  }

  if (role === "EMPLOYER" && conversation.company.userId !== userId) {
    throw new ApiError("Forbidden", 403);
  }

  if (role === "SEEKER") {
    const seeker = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seeker || conversation.seekerId !== seeker.id) {
      throw new ApiError("Forbidden", 403);
    }
  }

  return conversation;
}

function mapConversationListItem(conv: {
  id: string;
  lastMessageAt: Date;
  company: { id: string; companyName: string; logoUrl: string | null };
  seeker: { id: string; fullName: string; headline: string | null };
  job: { id: string; title: string } | null;
  messages: { body: string; createdAt: Date; senderUserId: string }[];
  _count: { messages: number };
}): ConversationListItem {
  const last = conv.messages[0] ?? null;

  return {
    id: conv.id,
    lastMessageAt: conv.lastMessageAt.toISOString(),
    job: conv.job,
    company: conv.company,
    seeker: conv.seeker,
    lastMessage: last
      ? { body: last.body, createdAt: last.createdAt.toISOString(), senderUserId: last.senderUserId }
      : null,
    unreadCount: conv._count.messages,
  };
}

export async function listConversationsForUser(userId: string, role: string) {
  let where: Prisma.ConversationWhereInput;

  if (role === "EMPLOYER") {
    const company = await requireEmployerCompany(userId);
    where = { companyId: company.id };
  } else if (role === "SEEKER") {
    const seeker = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seeker) throw new ApiError("Seeker profile not found", 404);
    where = { seekerId: seeker.id };
  } else {
    throw new ApiError("Forbidden", 403);
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    include: {
      company: { select: { id: true, companyName: true, logoUrl: true } },
      seeker: { select: { id: true, fullName: true, headline: true } },
      job: { select: { id: true, title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderUserId: true },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderUserId: { not: userId },
              readAt: null,
            },
          },
        },
      },
    },
  });

  return conversations.map((c) => mapConversationListItem(c));
}

export async function getConversationThread(userId: string, role: string, conversationId: string) {
  const conversation = await requireConversationAccess(userId, role, conversationId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderUserId: true,
      readAt: true,
    },
  });

  // Access already verified above — skip a second requireConversationAccess round-trip.
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderUserId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return {
    id: conversation.id,
    job: conversation.job,
    company: conversation.company,
    seeker: conversation.seeker,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
      senderUserId: m.senderUserId,
      isMine: m.senderUserId === userId,
    })),
  };
}

export async function getMessagesAfter(
  userId: string,
  role: string,
  conversationId: string,
  afterMessageId?: string
) {
  await requireConversationAccess(userId, role, conversationId);

  let messages;
  if (afterMessageId) {
    const cursor = await prisma.message.findFirst({
      where: { id: afterMessageId, conversationId },
      select: { createdAt: true, id: true },
    });

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
    messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderUserId: true,
      },
    });
  }

  if (messages.some((m) => m.senderUserId !== userId)) {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderUserId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  return messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    senderUserId: m.senderUserId,
    isMine: m.senderUserId === userId,
  }));
}

export async function createOrGetConversation(employerUserId: string, raw: unknown) {
  const input = conversationCreateSchema.parse(raw);
  const company = await requireEmployerCompany(employerUserId);

  const seeker = await prisma.seekerProfile.findUnique({
    where: { id: input.seekerId },
    include: { user: { select: { id: true } } },
  });

  if (!seeker) {
    throw new ApiError("Seeker not found", 404);
  }

  if (!seeker.profileVisibility) {
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

  let conversation = await prisma.conversation.findUnique({
    where: {
      companyId_seekerId: { companyId: company.id, seekerId: seeker.id },
    },
    include: {
      company: { select: { id: true, companyName: true, logoUrl: true } },
      seeker: { select: { id: true, fullName: true, headline: true } },
      job: { select: { id: true, title: true } },
    },
  });

  const conversationInclude = {
    company: { select: { id: true, companyName: true, logoUrl: true } },
    seeker: { select: { id: true, fullName: true, headline: true } },
    job: { select: { id: true, title: true } },
  } as const;

  if (!conversation) {
    try {
      conversation = await prisma.conversation.create({
        data: {
          companyId: company.id,
          seekerId: seeker.id,
          jobId: input.jobId ?? null,
        },
        include: conversationInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        conversation = await prisma.conversation.findUnique({
          where: {
            companyId_seekerId: { companyId: company.id, seekerId: seeker.id },
          },
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

  if (input.jobId && !conversation.jobId) {
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { jobId: input.jobId },
      include: conversationInclude,
    });
  }

  if (input.initialMessage) {
    await sendMessage(employerUserId, "EMPLOYER", conversation.id, { body: input.initialMessage });
  }

  return conversation;
}

export async function sendMessage(
  userId: string,
  role: string,
  conversationId: string,
  raw: unknown
) {
  const input = messageCreateSchema.parse(raw);
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
  }

  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    readAt: null,
    senderUserId: message.senderUserId,
    isMine: true,
  };
}

export async function markConversationRead(userId: string, role: string, conversationId: string) {
  await requireConversationAccess(userId, role, conversationId);

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderUserId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { ok: true };
}
