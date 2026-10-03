import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { recordEvent } from "@/lib/admin/events";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";
import { invalidateSeekerApplications } from "@/lib/seeker/cache";
import { canMoveCollaborativeCandidate, requireCollaborativeJobAccess } from "@/lib/collaborative-hiring-reviews";
import { stageChangeActivityData } from "@/lib/jobs/stage-history";
import { hiredTransitionData, afterFirstHire } from "@/lib/hiring/mark-hired";
import {
  createOfferBlocker,
  formatOfferRate,
  offerActionBlocker,
  offerExpiry,
} from "@/lib/hiring/offer-state";
import {
  notifyOfferAccepted,
  notifyOfferDeclined,
  notifyOfferReceived,
  notifyOfferWithdrawn,
} from "@/lib/hiring/offer-notify";
import { createOfferSchema, respondToOfferSchema } from "@/lib/validations/offer";

type EmployerActor = { companyId: string; memberId: string | null; userId: string };

/**
 * The one authorization point for every employer-side offer action. The
 * company owner is authorized directly; anyone else goes through the same
 * job-access and permission rules as the collaborative pipeline route
 * (requireCollaborativeJobAccess refuses unassigned hiring managers, and
 * canMoveCollaborativeCandidate gates the role). Session role is deliberately
 * NOT checked by the routes — this is the whole check. Throws 404 for an
 * unknown application.
 */
async function resolveOfferActor(userId: string, applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      seekerId: true,
      firstEmployerResponseAt: true,
      hiredAt: true,
      hireSource: true,
      hireConfirmedBySeekerAt: true,
      job: {
        select: {
          id: true,
          title: true,
          companyId: true,
          company: { select: { id: true, userId: true, companyName: true } },
        },
      },
      seeker: {
        select: {
          fullName: true,
          user: { select: { id: true, email: true, notifyApplicationUpdates: true } },
        },
      },
    },
  });
  if (!application) throw new ApiError("Application not found", 404);

  const companyId = application.job.companyId;
  let actor: EmployerActor;
  if (application.job.company.userId === userId) {
    actor = { companyId, memberId: null, userId };
  } else {
    const { membership } = await requireCollaborativeJobAccess(companyId, userId, application.job.id);
    if (!canMoveCollaborativeCandidate(membership.role)) {
      throw new ApiError("You do not have permission to make offers.", 403);
    }
    actor = { companyId, memberId: membership.id, userId };
  }

  return { actor, application };
}

/** Persists the "PENDING past expiresAt is EXPIRED" rule for one application. */
async function expirePendingOffers(applicationId: string) {
  await prisma.jobOffer.updateMany({
    where: { applicationId, status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

const OPEN_OFFER_CONFLICT = "This candidate already has an open offer. Withdraw it before sending a new one.";

export async function createOffer(userId: string, applicationId: string, raw: unknown) {
  const input = createOfferSchema.parse(raw);
  const { actor, application } = await resolveOfferActor(userId, applicationId);

  const blocker = createOfferBlocker(application.status);
  if (blocker) throw new ApiError(blocker, 400);

  await expirePendingOffers(applicationId);
  const open = await prisma.jobOffer.findFirst({
    where: { applicationId, status: "PENDING" },
    select: { id: true },
  });
  if (open) throw new ApiError(OPEN_OFFER_CONFLICT, 409);

  let offer;
  try {
    offer = await prisma.$transaction(async (tx) => {
      const created = await tx.jobOffer.create({
        data: {
          applicationId,
          companyId: actor.companyId,
          createdByMemberId: actor.memberId,
          createdByUserId: actor.userId,
          title: input.title,
          monthlyRateCents: input.rateType === "MONTHLY" ? input.rateCents : null,
          hourlyRateCents: input.rateType === "HOURLY" ? input.rateCents : null,
          currency: input.currency,
          hoursPerWeek: input.hoursPerWeek ?? null,
          startDate: input.startDate ? new Date(input.startDate + "T00:00:00Z") : null,
          message: input.message || null,
          expiresAt: offerExpiry(),
        },
      });
      // An offer is employer engagement (see the Application.firstEmployerResponseAt schema comment).
      if (application.firstEmployerResponseAt == null) {
        await tx.application.update({
          where: { id: applicationId },
          data: { firstEmployerResponseAt: new Date() },
        });
      }
      return created;
    });
  } catch (error) {
    // Lost a race against the partial unique index on open offers.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(OPEN_OFFER_CONFLICT, 409);
    }
    throw error;
  }

  invalidateEmployerWorkspace(actor.companyId);
  invalidateSeekerApplications(application.seeker.user.id);

  recordEvent({
    eventType: "OFFER_SENT",
    actorType: "EMPLOYER",
    userId,
    entityType: "APPLICATION",
    entityId: applicationId,
    metadata: { offerId: offer.id, jobId: application.job.id },
  });

  // Fire-and-forget: a notification failure must not fail the offer.
  notifyOfferReceived({
    seekerUserId: application.seeker.user.id,
    seekerEmail: application.seeker.user.email,
    seekerName: application.seeker.fullName,
    notify: application.seeker.user.notifyApplicationUpdates,
    companyName: application.job.company.companyName,
    jobTitle: application.job.title,
    offerTitle: offer.title,
    rateLabel: formatOfferRate(offer),
    startDate: offer.startDate,
    expiresAt: offer.expiresAt,
  }).catch((err) => console.error("[hiring/offers] failed to notify seeker of offer:", err));

  return offer;
}

export async function listOffersForApplication(userId: string, applicationId: string) {
  await resolveOfferActor(userId, applicationId);
  await expirePendingOffers(applicationId);
  return prisma.jobOffer.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function withdrawOffer(userId: string, offerId: string) {
  const offer = await prisma.jobOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new ApiError("Offer not found", 404);

  const { actor, application } = await resolveOfferActor(userId, offer.applicationId);

  const blocker = offerActionBlocker(offer);
  if (blocker) throw new ApiError(blocker, 400);

  // Conditional on PENDING so a concurrent accept can't be overwritten.
  const { count } = await prisma.jobOffer.updateMany({
    where: { id: offerId, status: "PENDING" },
    data: { status: "WITHDRAWN", respondedAt: new Date() },
  });
  if (count === 0) throw new ApiError("This offer is no longer open.", 409);

  invalidateEmployerWorkspace(actor.companyId);
  invalidateSeekerApplications(application.seeker.user.id);

  recordEvent({
    eventType: "OFFER_WITHDRAWN",
    actorType: "EMPLOYER",
    userId,
    entityType: "APPLICATION",
    entityId: application.id,
    metadata: { offerId, jobId: application.job.id },
  });

  notifyOfferWithdrawn({
    seekerUserId: application.seeker.user.id,
    companyName: application.job.company.companyName,
    jobTitle: application.job.title,
  }).catch((err) => console.error("[hiring/offers] failed to notify seeker of withdrawal:", err));

  return { ok: true as const, id: offerId };
}

export async function getPendingOffersForSeeker(userId: string) {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) return [];

  await prisma.jobOffer.updateMany({
    where: { application: { seekerId: profile.id }, status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });

  return prisma.jobOffer.findMany({
    where: { application: { seekerId: profile.id }, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        select: {
          id: true,
          job: { select: { id: true, title: true, company: { select: { companyName: true, logoUrl: true } } } },
        },
      },
    },
  });
}

/**
 * Loads one offer scoped strictly through the caller's own seeker profile —
 * same ownership-by-profile guard as loadOwnedInterview
 * (lib/seeker/interviews.ts). Returns null when the offer doesn't exist or
 * isn't theirs, so callers surface one 404 and never reveal which case it was.
 */
async function loadOwnedOffer(userId: string, offerId: string) {
  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: { id: true, fullName: true },
  });
  if (!profile) return null;

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        select: {
          id: true,
          seekerId: true,
          job: { select: { id: true, title: true, companyId: true } },
        },
      },
    },
  });
  if (!offer || offer.application.seekerId !== profile.id) return null;

  return { offer, profile };
}

export async function respondToOffer(userId: string, offerId: string, raw: unknown) {
  const input = respondToOfferSchema.parse(raw);

  const owned = await loadOwnedOffer(userId, offerId);
  if (!owned) throw new ApiError("Offer not found", 404);
  const { offer, profile } = owned;
  const { application } = offer;

  const blocker = offerActionBlocker(offer);
  if (blocker) {
    // Persist the lazy expiry so every other reader sees it too.
    if (offer.status === "PENDING") {
      await prisma.jobOffer.updateMany({ where: { id: offerId, status: "PENDING" }, data: { status: "EXPIRED" } });
    }
    throw new ApiError(blocker, 400);
  }

  if (!input.accept) {
    const { count } = await prisma.jobOffer.updateMany({
      where: { id: offerId, status: "PENDING" },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
        declineReason: input.declineReason || null,
      },
    });
    if (count === 0) throw new ApiError("This offer is no longer open.", 409);

    invalidateEmployerWorkspace(application.job.companyId);
    invalidateSeekerApplications(userId);

    recordEvent({
      eventType: "OFFER_DECLINED",
      actorType: "SEEKER",
      userId,
      entityType: "APPLICATION",
      entityId: application.id,
      metadata: { offerId, jobId: application.job.id },
    });

    notifyOfferDeclined({
      jobId: application.job.id,
      seekerName: profile.fullName,
      jobTitle: application.job.title,
    }).catch((err) => console.error("[hiring/offers] failed to notify employer of decline:", err));

    return {
      offer: await prisma.jobOffer.findUniqueOrThrow({ where: { id: offerId } }),
      application: null,
    };
  }

  // Accept: offer + application + stage history commit together or not at all.
  const result = await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: application.id },
      select: {
        id: true,
        status: true,
        hiredAt: true,
        hireSource: true,
        hireConfirmedBySeekerAt: true,
        seekerId: true,
      },
    });
    if (!app) throw new ApiError("Application not found", 404);

    // The employer may have marked HIRED/REJECTED while the offer sat open.
    const appBlocker = createOfferBlocker(app.status);
    if (appBlocker) throw new ApiError(appBlocker, 400);

    const { count } = await tx.jobOffer.updateMany({
      where: { id: offerId, status: "PENDING" },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    if (count === 0) throw new ApiError("This offer is no longer open.", 409);

    const hire = hiredTransitionData(app, "HIRED", { hireSource: "OFFER_ACCEPTED", seekerConfirmed: true });
    const updatedApp = await tx.application.update({
      where: { id: app.id },
      data: { status: "HIRED", ...hire.data },
      select: { id: true, status: true, hiredAt: true, hireSource: true },
    });
    await tx.applicationActivity.create({
      data: stageChangeActivityData({
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: "HIRED",
        actorMemberId: null,
      }),
    });
    const updatedOffer = await tx.jobOffer.findUniqueOrThrow({ where: { id: offerId } });

    return { hire, fromStatus: app.status, application: updatedApp, offer: updatedOffer };
  });

  if (result.hire.firstHire) {
    afterFirstHire({
      seekerProfileId: profile.id,
      applicationId: application.id,
      jobId: application.job.id,
      actorType: "SEEKER",
      actorUserId: userId,
    });
  }

  recordEvent({
    eventType: "APPLICATION_STATUS_CHANGED",
    actorType: "SEEKER",
    userId,
    entityType: "APPLICATION",
    entityId: application.id,
    metadata: { from: result.fromStatus, to: "HIRED" },
  });
  recordEvent({
    eventType: "OFFER_ACCEPTED",
    actorType: "SEEKER",
    userId,
    entityType: "APPLICATION",
    entityId: application.id,
    metadata: { offerId, jobId: application.job.id },
  });

  invalidateEmployerWorkspace(application.job.companyId);
  invalidateSeekerApplications(userId);

  // Deliberately not notifyApplicationStatusTransition: the VA just accepted,
  // so they get the acceptance confirmation instead of "you got the job".
  notifyOfferAccepted({
    jobId: application.job.id,
    seekerUserId: userId,
    seekerName: profile.fullName,
    jobTitle: application.job.title,
    rateLabel: formatOfferRate(result.offer),
  }).catch((err) => console.error("[hiring/offers] failed to notify of accepted offer:", err));

  return { offer: result.offer, application: result.application };
}

export async function confirmHire(userId: string, applicationId: string) {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new ApiError("Application not found", 404);

  const application = await prisma.application.findFirst({
    where: { id: applicationId, seekerId: profile.id },
    select: {
      id: true,
      status: true,
      hireConfirmedBySeekerAt: true,
      job: { select: { id: true, companyId: true } },
    },
  });
  if (!application) throw new ApiError("Application not found", 404);
  if (application.status !== "HIRED") {
    throw new ApiError("Only hired applications can be confirmed.", 400);
  }
  // Idempotent: a second confirm is a no-op, not an error.
  if (application.hireConfirmedBySeekerAt) {
    return { id: application.id, hireConfirmedBySeekerAt: application.hireConfirmedBySeekerAt };
  }

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { hireConfirmedBySeekerAt: new Date() },
    select: { id: true, hireConfirmedBySeekerAt: true },
  });

  invalidateEmployerWorkspace(application.job.companyId);
  invalidateSeekerApplications(userId);

  recordEvent({
    eventType: "HIRE_CONFIRMED_BY_SEEKER",
    actorType: "SEEKER",
    userId,
    entityType: "APPLICATION",
    entityId: application.id,
    metadata: { jobId: application.job.id },
  });

  return updated;
}

/** Waitlist signal for the hire guarantee package — an event only, no table (plan §3). */
export async function recordGuaranteeInterest(userId: string, applicationId: string) {
  const { actor, application } = await resolveOfferActor(userId, applicationId);
  if (application.status !== "HIRED") {
    throw new ApiError("Only hired applications can register guarantee interest.", 400);
  }

  recordEvent({
    eventType: "HIRE_GUARANTEE_INTEREST",
    actorType: "EMPLOYER",
    userId,
    entityType: "APPLICATION",
    entityId: applicationId,
    metadata: { companyId: actor.companyId, hireSource: application.hireSource ?? null },
  });

  return { ok: true as const };
}
