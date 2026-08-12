import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Single cached lookup for employer company by user id — used by session and API guards. */
export const getEmployerCompanyByUserId = cache(async (userId: string) => {
  return prisma.company.findUnique({
    where: { userId },
  });
});

/** @deprecated Use getEmployerCompanyByUserId */
export const getEmployerCompanyCached = getEmployerCompanyByUserId;
