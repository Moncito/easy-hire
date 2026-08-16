import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { generateAiObject } from "@/lib/ai/run";

export const messageDraftToneSchema = z.enum([
  "first_outreach",
  "follow_up",
  "interview_invite",
  "rejection",
]);

export const messageDraftInputSchema = z.object({
  applicationId: z.string().min(1),
  tone: messageDraftToneSchema,
  context: z.string().max(1000).optional(),
});
export type MessageDraftInput = z.infer<typeof messageDraftInputSchema>;

const messageDraftOutputSchema = z.object({
  body: z.string().describe("The drafted message body, ready to review and edit before sending"),
});
export type MessageDraftOutput = z.infer<typeof messageDraftOutputSchema>;

const TONE_INSTRUCTIONS: Record<z.infer<typeof messageDraftToneSchema>, string> = {
  first_outreach: "A warm first message inviting the candidate to a conversation about the role.",
  follow_up: "A friendly follow-up checking in since there's been no response yet.",
  interview_invite: "An invitation to schedule an interview, with an easy way to reply with availability.",
  rejection:
    "A kind, respectful decline. Be honest but supportive, thank them for applying, and avoid vague or false promises.",
};

/**
 * Drafts a message for the employer to review and send manually via the
 * existing conversations API. This never sends a message or changes
 * `Application.status` itself — especially important for the rejection
 * tone, which only produces a draft a human must approve and send.
 */
export async function draftApplicationMessage(companyId: string, input: MessageDraftInput) {
  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, job: { companyId } },
    include: {
      job: { select: { title: true } },
      seeker: { select: { fullName: true, headline: true } },
    },
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  const prompt = `
Candidate name: ${application.seeker.fullName}
Candidate headline: ${application.seeker.headline ?? "N/A"}
Job title: ${application.job.title}
Current application status: ${application.status}
Goal: ${TONE_INSTRUCTIONS[input.tone]}
${input.context ? `Employer notes to incorporate: ${input.context}` : ""}
`.trim();

  return generateAiObject({
    companyId,
    feature: "message-draft",
    schema: messageDraftOutputSchema,
    system:
      "You draft short, friendly candidate messages for an employer on a Virtual Assistant hiring marketplace (EasyHire). Keep it under 120 words, first person from the employer, no placeholders left unfilled.",
    prompt,
    metadata: { applicationId: application.id, tone: input.tone },
  });
}
