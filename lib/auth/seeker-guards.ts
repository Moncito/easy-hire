import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export async function requireSeekerProfile(userId: string) {
  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new ApiError("Seeker profile not found", 404);
  }

  return profile;
}
