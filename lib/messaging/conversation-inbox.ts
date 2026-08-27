import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";

export type ConversationListItem = {
  id: string;
  lastMessageAt: string;
  job: { id: string; title: string } | null;
  company: { id: string; companyName: string; logoUrl: string | null };
  seeker: { id: string; fullName: string; headline: string | null; photoUrl: string | null };
  lastMessage: { body: string; createdAt: string; senderUserId: string } | null;
  unreadCount: number;
  applicationStatus: string | null;
  /** Populated by the Collaborative Hiring conversation list (no talent-search equivalent there to link out to instead); omitted by the owner's own list. */
  applicationId?: string | null;
};

export async function listConversationsForUser(userId: string, role: string) {
  let where: Prisma.ConversationWhereInput;
  let seekerId: string | null = null;
  let companyId: string | null = null;

  if (role === "EMPLOYER") {
    const company = await requireEmployerCompany(userId);
    companyId = company.id;
    where = { companyId: company.id };
  } else if (role === "SEEKER") {
    const seeker = await prisma.seekerProfile.findUnique({ where: { userId } });
    if (!seeker) throw new ApiError("Seeker profile not found", 404);
    seekerId = seeker.id;
    where = { seekerId: seeker.id };
  } else {
    throw new ApiError("Forbidden", 403);
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    relationLoadStrategy: "join",
    select: {
      id: true,
      lastMessageAt: true,
      seekerId: true,
      company: { select: { id: true, companyName: true, logoUrl: true } },
      seeker: { select: { id: true, fullName: true, headline: true, photoUrl: true } },
      job: { select: { id: true, title: true } },
    },
  });

  if (conversations.length === 0) {
    return [] as ConversationListItem[];
  }

  const conversationIds = conversations.map((c) => c.id);
  const jobIds = [
    ...new Set(conversations.map((c) => c.job?.id).filter((id): id is string => Boolean(id))),
  ];

  const [lastMessages, unreadGroups, applications] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["conversationId"],
      select: {
        conversationId: true,
        body: true,
        createdAt: true,
        senderUserId: true,
      },
    }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversationIds },
        senderUserId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    }),
    jobIds.length > 0
      ? role === "SEEKER" && seekerId
        ? prisma.application.findMany({
            where: { seekerId, jobId: { in: jobIds } },
            select: { jobId: true, status: true },
          })
        : companyId
          ? prisma.application.findMany({
              where: { jobId: { in: jobIds }, job: { companyId } },
              select: { jobId: true, seekerId: true, status: true },
            })
          : []
      : [],
  ]);

  const lastMessageByConv = new Map(lastMessages.map((m) => [m.conversationId, m]));
  const unreadByConv = new Map(unreadGroups.map((g) => [g.conversationId, g._count._all]));

  let statusByJob: Record<string, string> = {};
  if (role === "SEEKER") {
    statusByJob = Object.fromEntries(
      (applications as Array<{ jobId: string; status: string }>).map((a) => [a.jobId, a.status])
    );
  } else {
    for (const app of applications as Array<{ jobId: string; seekerId: string; status: string }>) {
      statusByJob[`${app.jobId}:${app.seekerId}`] = app.status;
    }
  }

  return conversations.map((c) => {
    const last = lastMessageByConv.get(c.id);
    const applicationStatus = c.job
      ? role === "EMPLOYER"
        ? statusByJob[`${c.job.id}:${c.seekerId}`] ?? null
        : statusByJob[c.job.id] ?? null
      : null;

    return {
      id: c.id,
      lastMessageAt: c.lastMessageAt.toISOString(),
      job: c.job,
      company: c.company,
      seeker: c.seeker,
      lastMessage: last
        ? {
            body: last.body,
            createdAt: last.createdAt.toISOString(),
            senderUserId: last.senderUserId,
          }
        : null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
      applicationStatus,
    };
  });
}
