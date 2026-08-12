import { prisma } from "@/lib/prisma";

export async function getEmployerNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
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

export function notificationHref(type: string): string | null {
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
