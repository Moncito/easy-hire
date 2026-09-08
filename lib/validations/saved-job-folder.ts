import { z } from "zod";

export const savedJobFolderCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Keep names under 80 characters"),
});

export const savedJobFolderUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Keep names under 80 characters"),
});

export const savedJobFolderItemCreateSchema = z.object({
  savedJobId: z.string().min(1),
});
