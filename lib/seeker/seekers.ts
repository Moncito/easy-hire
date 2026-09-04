import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { seekerInputToData, seekerUpdateSchema } from "@/lib/validations/seeker";
import { seekerApplicationsTag, seekerProfileTag } from "@/lib/seeker/cache-tags";
import { reviveDates } from "@/lib/cache-utils";
import { hydrateResumeFields } from "@/lib/seeker/resume-urls";
import { recomputeVerificationScore } from "@/lib/seeker/identity-verification";
import { RESUME_BUCKET, assertOwnedObjectPath } from "@/lib/shared/storage";
import { parseResume, formatResume } from "@/lib/seeker-profile-format";

const SEEKER_PROFILE_REVALIDATE_SECONDS = 30;

function findSeekerProfileRow(userId: string) {
  return prisma.seekerProfile.findUnique({ where: { userId } });
}

/** Existence check hit by ensureSeekerProfile on nearly every seeker page load — cached so it's not a Prisma round-trip every time. */
async function getSeekerProfileRowCached(userId: string) {
  const row = await unstable_cache(
    () => findSeekerProfileRow(userId),
    ["seeker-profile-row", userId],
    { revalidate: SEEKER_PROFILE_REVALIDATE_SECONDS, tags: [seekerProfileTag(userId)] }
  )();
  return reviveDates(row);
}

/** Drop the cached profile for one seeker (call after profile create/update). */
export function invalidateSeekerProfile(userId: string) {
  revalidateTag(seekerProfileTag(userId), "max");
}

export async function ensureSeekerProfile(
  userId: string,
  defaults: { fullName?: string } = {}
) {
  const existing = await getSeekerProfileRowCached(userId);
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`Cannot create seeker profile: user ${userId} not found`);
  }

  try {
    const created = await prisma.seekerProfile.create({
      data: {
        userId,
        fullName: defaults.fullName?.trim() || "",
        skills: [],
      },
    });
    invalidateSeekerProfile(userId);
    return created;
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
  const result = await unstable_cache(
    () =>
      prisma.seekerProfile.findUnique({
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
      }),
    ["seeker-profile-full", userId],
    { revalidate: SEEKER_PROFILE_REVALIDATE_SECONDS, tags: [seekerProfileTag(userId), seekerApplicationsTag(userId)] }
  )();
  const revived = reviveDates(result);
  if (!revived) return revived;
  return hydrateResumeFields(revived);
}

export async function updateSeekerProfile(userId: string, raw: unknown) {
  const input = seekerUpdateSchema.parse(raw);

  const existing = await ensureSeekerProfile(userId);

  const allowedPrefixes = [`${userId}/`];

  if (input.resumeUrl) {
    input.resumeUrl = assertOwnedObjectPath(RESUME_BUCKET, input.resumeUrl, allowedPrefixes, {
      allowUnchanged: existing.resumeUrl,
    });
  }

  if (input.resumes) {
    const existingResumeUrls = new Set(existing.resumes.map((r) => parseResume(r).url));
    input.resumes = input.resumes.map((entry) => {
      const parsed = parseResume(entry);
      const ownedUrl = assertOwnedObjectPath(RESUME_BUCKET, parsed.url, allowedPrefixes, {
        allowUnchanged: existingResumeUrls.has(parsed.url) ? parsed.url : null,
      });
      return formatResume({ ...parsed, url: ownedUrl });
    });
  }

  const updated = await prisma.seekerProfile.update({
    where: { userId },
    data: seekerInputToData(input),
  });
  invalidateSeekerProfile(userId);
  // Profile completeness feeds the verification score — recompute on every
  // save. Fire-and-forget: must never block a profile save.
  void recomputeVerificationScore(updated.id).catch((err) =>
    console.error("[seekers] verification score recompute failed:", err)
  );
  return updated;
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
