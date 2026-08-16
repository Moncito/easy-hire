import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { isEmployerPro } from "@/lib/billing/subscriptions";
import {
  talentListCreateSchema,
  talentListUpdateSchema,
  talentListItemCreateSchema,
} from "@/lib/validations/talent-list";

/** Saved talent lists are an Employer Pro collections feature — SavedSeeker stays the Free bookmark. */
async function assertProForTalentLists(companyId: string) {
  const pro = await isEmployerPro(companyId);
  if (!pro) {
    throw new ApiError("Saved talent lists are an Employer Pro feature. Upgrade to create collections.", 403);
  }
}

async function requireListForCompany(companyId: string, listId: string) {
  const list = await prisma.savedTalentList.findFirst({ where: { id: listId, companyId } });
  if (!list) {
    throw new ApiError("Talent list not found", 404);
  }
  return list;
}

export async function listTalentLists(companyId: string) {
  return prisma.savedTalentList.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function getTalentListWithItems(companyId: string, listId: string) {
  const list = await prisma.savedTalentList.findFirst({
    where: { id: listId, companyId },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          seeker: {
            select: {
              id: true,
              fullName: true,
              headline: true,
              location: true,
              skills: true,
              photoUrl: true,
            },
          },
        },
      },
    },
  });

  if (!list) {
    throw new ApiError("Talent list not found", 404);
  }

  return list;
}

export async function createTalentList(companyId: string, raw: unknown) {
  await assertProForTalentLists(companyId);
  const input = talentListCreateSchema.parse(raw);

  try {
    return await prisma.savedTalentList.create({
      data: { companyId, name: input.name },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("You already have a list with that name", 409);
    }
    throw error;
  }
}

export async function renameTalentList(companyId: string, listId: string, raw: unknown) {
  await requireListForCompany(companyId, listId);
  const input = talentListUpdateSchema.parse(raw);

  try {
    return await prisma.savedTalentList.update({
      where: { id: listId },
      data: { name: input.name },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("You already have a list with that name", 409);
    }
    throw error;
  }
}

export async function deleteTalentList(companyId: string, listId: string) {
  await requireListForCompany(companyId, listId);
  await prisma.savedTalentList.delete({ where: { id: listId } });
  return { ok: true };
}

export async function addSeekerToTalentList(companyId: string, listId: string, raw: unknown) {
  await assertProForTalentLists(companyId);
  await requireListForCompany(companyId, listId);
  const input = talentListItemCreateSchema.parse(raw);

  const seeker = await prisma.seekerProfile.findFirst({
    where: { id: input.seekerId, visibility: { in: ["STANDARD", "PUBLIC"] } },
  });
  if (!seeker) {
    throw new ApiError("Seeker not found", 404);
  }

  return prisma.savedTalentListItem.upsert({
    where: { listId_seekerId: { listId, seekerId: seeker.id } },
    create: { listId, seekerId: seeker.id, note: input.note ?? null },
    update: { note: input.note ?? null },
  });
}

export async function removeSeekerFromTalentList(companyId: string, listId: string, seekerId: string) {
  await requireListForCompany(companyId, listId);
  await prisma.savedTalentListItem.deleteMany({ where: { listId, seekerId } });
  return { ok: true };
}
