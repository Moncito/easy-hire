import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { createNotification } from "@/lib/email";
import { loadInterviewEmailContext, priorIcsSequence } from "@/lib/collaborative-interviews";
import { generateInterviewIcs } from "@/lib/shared/calendar-invite";
import { interviewFormatLabel } from "@/lib/shared/interview-format";
import { invalidateSeekerInterviews } from "@/lib/seeker/cache";

/**
 * Loads one interview scoped strictly through the caller's own seeker
 * profile — same ownership-by-profile-id guard as getSeekerInterviews
 * (lib/seeker/dashboard.ts): never trust a client-supplied seeker id, always
 * derive it from the session's userId. Returns null (never throws) when the
 * interview doesn't exist or isn't owned by this seeker, so callers can
 * surface a consistent 404 rather than leaking which case it was.
 */
async function loadOwnedInterview(userId: string, interviewId: string) {
  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    select: {
      id: true,
      applicationId: true,
      scheduledAt: true,
      durationMins: true,
      format: true,
      location: true,
      status: true,
      seekerResponseStatus: true,
      seekerRespondedAt: true,
      createdAt: true,
      updatedAt: true,
      application: { select: { seekerId: true } },
    },
  });
  if (!interview || interview.application.seekerId !== profile.id) return null;

  return interview;
}

async function notifyEmployerOfResponse(applicationId: string, response: "ACCEPTED" | "DECLINED") {
  const ctx = await loadInterviewEmailContext(applicationId);
  if (!ctx) return;
  const verb = response === "ACCEPTED" ? "accepted" : "declined";
  await createNotification(
    ctx.companyUserId,
    response === "ACCEPTED" ? "INTERVIEW_ACCEPTED" : "INTERVIEW_DECLINED",
    `${ctx.seekerName} ${verb} the interview for "${ctx.jobTitle}".`
  );
}

/**
 * A seeker accepting/declining a SCHEDULED interview. One response sticks —
 * this deliberately refuses a second call once seekerResponseStatus is set,
 * so a seeker changing their mind isn't silently allowed to flip back and
 * forth in this first version. The employer side would otherwise have no
 * visibility into the response at all, so this always fires an in-app
 * Notification to the company owner (no email — the notification is the
 * meaningful fix here).
 */
export async function respondToInterview(
  userId: string,
  interviewId: string,
  response: "ACCEPTED" | "DECLINED"
) {
  const interview = await loadOwnedInterview(userId, interviewId);
  if (!interview) throw new ApiError("Interview not found", 404);

  if (interview.status !== "SCHEDULED") {
    throw new ApiError("This interview can no longer be responded to.", 400);
  }
  if (interview.seekerResponseStatus) {
    throw new ApiError("You've already responded to this interview.", 400);
  }

  const updated = await prisma.interview.update({
    where: { id: interviewId },
    data: { seekerResponseStatus: response, seekerRespondedAt: new Date() },
    select: { id: true, seekerResponseStatus: true, seekerRespondedAt: true },
  });

  invalidateSeekerInterviews(userId);
  // There is no employer-side cache covering interview/applicant data to
  // invalidate here — listCompanyInterviews/listInterviews
  // (lib/collaborative-interviews.ts) and listJobApplications (lib/jobs/
  // applications.ts) are queried live, not through unstable_cache.
  // createNotification (lib/shared/email.ts) already invalidates both the
  // employer and seeker notification-cache tags for us.

  // Same fire-and-forget precedent as notifyScheduled/notifyRescheduled/
  // notifyCancelled in lib/collaborative-interviews.ts — a notification
  // failure must not fail the seeker's RSVP.
  notifyEmployerOfResponse(interview.applicationId, response).catch((err) =>
    console.error("[seeker/interviews] failed to notify employer of interview response:", err)
  );

  return updated;
}

/**
 * Builds the raw .ics text for one interview, for the in-app download
 * endpoint (app/api/seeker/interviews/[interviewId]/ics). Reuses the exact
 * same context-loading and SEQUENCE derivation the emailed invite already
 * uses (lib/collaborative-interviews.ts's notifyScheduled), so the
 * downloaded file matches whatever was last emailed. Refuses a CANCELLED
 * interview — no calendar file for a slot that no longer exists.
 */
export async function getInterviewIcsForSeeker(userId: string, interviewId: string): Promise<string> {
  const interview = await loadOwnedInterview(userId, interviewId);
  if (!interview) throw new ApiError("Interview not found", 404);
  if (interview.status === "CANCELLED") {
    throw new ApiError("This interview was cancelled.", 400);
  }

  const ctx = await loadInterviewEmailContext(interview.applicationId);
  if (!ctx) throw new ApiError("Interview not found", 404);

  return generateInterviewIcs({
    interviewId: interview.id,
    sequence: priorIcsSequence(interview),
    method: "REQUEST",
    scheduledAt: interview.scheduledAt,
    durationMins: interview.durationMins,
    summary: `Interview: ${ctx.jobTitle} at ${ctx.companyName}`,
    description: `${interviewFormatLabel(interview.format)} interview for ${ctx.jobTitle} at ${ctx.companyName}.`,
    location: interview.location ?? undefined,
    organizerEmail: ctx.organizerEmail,
    organizerName: ctx.companyName,
    attendeeEmail: ctx.seekerEmail,
    attendeeName: ctx.seekerName,
  });
}
