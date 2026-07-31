import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { seekerInputToData, seekerUpdateSchema } from "@/lib/validations/seeker";

export async function ensureSeekerProfile(
  userId: string,
  defaults: { fullName?: string } = {}
) {
  const existing = await prisma.seekerProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`Cannot create seeker profile: user ${userId} not found`);
  }

  try {
    return await prisma.seekerProfile.create({
      data: {
        userId,
        fullName: defaults.fullName?.trim() || "",
        skills: [],
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.seekerProfile.findUniqueOrThrow({ where: { userId } });
    }
    throw error;
  }
}

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

  await ensureSeekerProfile(userId);

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

export async function listSeekerAppliedJobIds(userId: string) {
  const apps = await prisma.application.findMany({
    where: { seeker: { userId } },
    select: { jobId: true },
  });
  return apps.map((a) => a.jobId);
}
