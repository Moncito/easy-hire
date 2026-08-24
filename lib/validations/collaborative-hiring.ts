import { z } from "zod";

export const companyMemberRoleSchema = z.enum(["OWNER", "RECRUITER", "HIRING_MANAGER", "VIEWER"]);

export const createInvitationSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: companyMemberRoleSchema.exclude(["OWNER"]),
});

export const updateMemberSchema = z.object({ role: companyMemberRoleSchema });
