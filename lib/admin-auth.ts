import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export async function requireAdmin(userId: string | undefined) {
  if (!userId) {
    throw new ApiError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError("Unauthorized", 401);
  }

  return user;
}
