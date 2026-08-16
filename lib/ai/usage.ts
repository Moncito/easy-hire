import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AiFeature =
  | "job-copy"
  | "rank"
  | "interview"
  | "message-draft"
  | "insights"
  | "screening-questions"
  | "company-brand"
  | "bulk-shortlist"
  | "resume-highlights"
  | "job-tips"
  | "spam-flag";

/** Logs one Easy AI generation for usage metering — never blocks the response on failure. */
export async function logAiUsage(input: {
  companyId: string;
  feature: AiFeature;
  tokens?: number | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    await prisma.aiUsageEvent.create({
      data: {
        companyId: input.companyId,
        feature: input.feature,
        tokens: input.tokens ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (error) {
    console.error("[ai-usage] failed to log usage:", error);
  }
}

export async function getAiUsageSummary(companyId: string, sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const events = await prisma.aiUsageEvent.groupBy({
    by: ["feature"],
    where: { companyId, createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { tokens: true },
  });

  return events.map((e) => ({
    feature: e.feature,
    count: e._count._all,
    tokens: e._sum.tokens ?? 0,
  }));
}

export async function listRecentAiUsage(companyId: string, limit = 20) {
  return prisma.aiUsageEvent.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
