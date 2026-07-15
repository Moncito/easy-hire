"use server";

// This file is imported by middleware and only exports the auth function
// It avoids directly importing Prisma to prevent Edge Runtime bundling
import { auth as nextAuthAuth } from "@/Auth";

export const auth = nextAuthAuth;
