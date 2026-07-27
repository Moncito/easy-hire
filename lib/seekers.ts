import { prisma } from "@/lib/prisma";
import { seekerInputToData, seekerUpdateSchema } from "@/lib/validations/seeker";

export async function getSeekerProfile(userId: string) {
  return prisma.seekerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true } },
      applications: {
        orderBy: { appliedAt: "desc" },
        take: 5,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
              company: { select: { companyName: true } },
            },
          },
        },
      },
    },
  });
}

export async function updateSeekerProfile(userId: string, raw: unknown) {
  const input = seekerUpdateSchema.parse(raw);

  return prisma.seekerProfile.update({
    where: { userId },
    data: seekerInputToData(input),
  });
}

export async function getSeekerApplicationForJob(userId: string, jobId: string) {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  return prisma.application.findUnique({
    where: { jobId_seekerId: { jobId, seekerId: profile.id } },
    select: { id: true, status: true, appliedAt: true },
  });
}
