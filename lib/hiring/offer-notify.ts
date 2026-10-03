import { prisma } from "@/lib/prisma";
import { createNotification, sendEmail } from "@/lib/shared/email";
import { emailDetailRow, renderEmailLayout } from "@/lib/shared/email-layout";
import { sendCategorizedEmail } from "@/lib/shared/email-preferences";
import { escapeHtml } from "@/lib/escape-html";
import { notificationHref } from "@/lib/shared/notifications";
import { APP_URL } from "@/lib/shared/app-url";

// All offer emails are EmailCategory "APPLICATION_UPDATES" — gated by the
// recipient's own notifyApplicationUpdates. Notification rows are always
// written; only the email is gated.

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * Everyone on the employer side who should hear about an offer response: the
 * company owner plus every member assigned to the job's team, deduped. The
 * owner's email/flag ride along because only the owner gets the email.
 */
async function loadEmployerRecipients(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      company: { select: { user: { select: { id: true, email: true, notifyApplicationUpdates: true } } } },
      teamMembers: { select: { member: { select: { userId: true } } } },
    },
  });
  if (!job) return null;

  const owner = job.company.user;
  const userIds = new Set<string>([owner.id]);
  for (const t of job.teamMembers) userIds.add(t.member.userId);
  return { owner, userIds: [...userIds] };
}

export async function notifyOfferReceived(ctx: {
  seekerUserId: string;
  seekerEmail: string;
  seekerName: string;
  notify: boolean;
  companyName: string;
  jobTitle: string;
  offerTitle: string;
  rateLabel: string;
  startDate: Date | null;
  expiresAt: Date;
}) {
  await Promise.all([
    createNotification(
      ctx.seekerUserId,
      "OFFER_RECEIVED",
      `${ctx.companyName} sent you an offer for "${ctx.jobTitle}".`
    ),
    sendCategorizedEmail("APPLICATION_UPDATES", ctx.notify, () =>
      sendEmail(
        ctx.seekerEmail,
        `Offer from ${ctx.companyName} — ${ctx.jobTitle}`,
        renderEmailLayout({
          preview: `${ctx.companyName} sent you an offer for ${ctx.jobTitle}.`,
          heading: "You have a job offer",
          badge: "OFFER",
          bodyHtml: `
            <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.seekerName)},</p>
            <p style="margin:0 0 16px;">
              <strong>${escapeHtml(ctx.companyName)}</strong> sent you an offer for
              <strong>${escapeHtml(ctx.jobTitle)}</strong>.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
              ${emailDetailRow("Role", escapeHtml(ctx.offerTitle))}
              ${emailDetailRow("Rate", escapeHtml(ctx.rateLabel))}
              ${ctx.startDate ? emailDetailRow("Start date", escapeHtml(formatDate(ctx.startDate))) : ""}
              ${emailDetailRow("Respond by", escapeHtml(formatDate(ctx.expiresAt)))}
            </table>
          `,
          cta: {
            label: "Review the offer",
            href: `${APP_URL}${notificationHref("OFFER_RECEIVED", "SEEKER")}`,
          },
        })
      )
    ),
  ]);
}

export async function notifyOfferAccepted(ctx: {
  jobId: string;
  seekerUserId: string;
  seekerName: string;
  jobTitle: string;
  rateLabel: string;
}) {
  const recipients = await loadEmployerRecipients(ctx.jobId);

  await Promise.all([
    // The VA's own confirmation replaces the generic "you got the job" email.
    createNotification(
      ctx.seekerUserId,
      "OFFER_ACCEPTED_CONFIRMATION",
      `You accepted the offer for "${ctx.jobTitle}". Congratulations!`
    ),
    ...(recipients
      ? [
          ...recipients.userIds.map((userId) =>
            createNotification(
              userId,
              "OFFER_ACCEPTED",
              `${ctx.seekerName} accepted your offer for "${ctx.jobTitle}".`
            )
          ),
          sendCategorizedEmail("APPLICATION_UPDATES", recipients.owner.notifyApplicationUpdates, () =>
            sendEmail(
              recipients.owner.email,
              `${ctx.seekerName} accepted your offer — ${ctx.jobTitle}`,
              renderEmailLayout({
                preview: `${ctx.seekerName} accepted your offer for ${ctx.jobTitle}.`,
                heading: "Offer accepted",
                badge: "OFFER",
                bodyHtml: `
                  <p style="margin:0 0 16px;">
                    <strong>${escapeHtml(ctx.seekerName)}</strong> accepted your offer for
                    <strong>${escapeHtml(ctx.jobTitle)}</strong> at ${escapeHtml(ctx.rateLabel)}.
                  </p>
                  <p style="margin:0;color:#5c6370;font-size:14px;">
                    The application is now marked as hired.
                  </p>
                `,
                cta: {
                  label: "View hire",
                  href: `${APP_URL}${notificationHref("OFFER_ACCEPTED", "EMPLOYER")}`,
                },
              })
            )
          ),
        ]
      : []),
  ]);
}

/** In-app only. */
export async function notifyOfferDeclined(ctx: { jobId: string; seekerName: string; jobTitle: string }) {
  const recipients = await loadEmployerRecipients(ctx.jobId);
  if (!recipients) return;
  await Promise.all(
    recipients.userIds.map((userId) =>
      createNotification(userId, "OFFER_DECLINED", `${ctx.seekerName} declined your offer for "${ctx.jobTitle}".`)
    )
  );
}

/** In-app only. */
export async function notifyOfferWithdrawn(ctx: { seekerUserId: string; companyName: string; jobTitle: string }) {
  await createNotification(
    ctx.seekerUserId,
    "OFFER_WITHDRAWN",
    `${ctx.companyName} withdrew their offer for "${ctx.jobTitle}".`
  );
}
