import { z } from "zod";

export const companyMemberRoleSchema = z.enum(["OWNER", "RECRUITER", "HIRING_MANAGER", "VIEWER"]);

export const createInvitationSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: companyMemberRoleSchema.exclude(["OWNER"]),
});

export const updateMemberSchema = z.object({ role: companyMemberRoleSchema });

/** Owner nominates a teammate. `password` for password accounts, `confirmation` phrase for Google-only ones. */
export const requestOwnershipTransferSchema = z.object({
  memberId: z.string().min(1),
  password: z.string().max(200).optional(),
  confirmation: z.string().max(100).optional(),
});

export const respondOwnershipTransferSchema = z.object({ action: z.enum(["accept", "decline"]) });
