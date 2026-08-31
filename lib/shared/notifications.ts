import { prisma } from "@/lib/prisma";

export async function getEmployerNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Cursor-paginated notification list — used by the seeker notifications
 * endpoint. Follows the same take+1/cursor/skip shape as
 * lib/jobs/public-listing.ts and lib/employer/talent.ts.
 */
export async function getSeekerNotifications(
  userId: string,
  { cursor, limit = 20 }: { cursor?: string; limit?: number } = {}
) {
  const boundedLimit = Math.min(Math.max(limit, 1), 50);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: boundedLimit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > boundedLimit;
  const page = hasMore ? notifications.slice(0, boundedLimit) : notifications;

  return {
    notifications: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readStatus: false },
  });
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  if (ids && ids.length > 0) {
    return prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { readStatus: true },
    });
  }
  return prisma.notification.updateMany({
    where: { userId, readStatus: false },
    data: { readStatus: true },
  });
}

export type NotificationRecipientRole = "SEEKER" | "EMPLOYER";

/**
 * Maps a notification type to the page a click should land on. Defaults to
 * "EMPLOYER" so existing single-argument call sites (e.g.
 * components/employer/EmployerNotificationBell.tsx) keep their exact
 * behaviour unchanged.
 *
 * Seeker-bound types are APPLICATION_REJECTED, NEW_MESSAGE, and
 * INTERVIEW_SCHEDULED (written from scheduleInterview in
 * lib/collaborative-interviews.ts) — every other type is only ever written
 * to an employer user (see createNotification call sites across /lib).
 * NEW_MESSAGE can't deep-link to a specific conversation: the notifications
 * table stores just { userId, type, message } with no conversationId, so
 * this always routes to the seeker inbox. INTERVIEW_SCHEDULED currently
 * routes to the dashboard too — there is no dedicated seeker interviews page
 * yet (backend-only Phase 2.3; a UI agent adds that landing separately).
 */
export function notificationHref(
  type: string,
  role: NotificationRecipientRole = "EMPLOYER"
): string | null {
  if (role === "SEEKER") {
    switch (type) {
      case "NEW_MESSAGE":
        return "/seeker/messages";
      case "APPLICATION_REJECTED":
        return "/seeker/dashboard";
      case "INTERVIEW_SCHEDULED":
        return "/seeker/dashboard";
      default:
        return "/seeker/dashboard";
    }
  }

  switch (type) {
    case "NEW_APPLICATION":
      return "/employer/applicants";
    case "NEW_MESSAGE":
      return "/employer/messages";
    case "JOB_APPROVED":
    case "JOB_REJECTED":
      return "/employer/jobs";
    case "COMPANY_APPROVED":
    case "COMPANY_REJECTED":
      return "/employer/company-profile";
    default:
      return "/employer/dashboard";
  }
}
