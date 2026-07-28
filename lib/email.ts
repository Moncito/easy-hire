import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromAddress = process.env.EMAIL_FROM ?? "EasyHire <onboarding@resend.dev>";
const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipped:", subject, "→", to);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] send failed:", error);
  }
}

export async function createNotification(userId: string, type: string, message: string) {
  return prisma.notification.create({
    data: { userId, type, message },
  });
}

type ApplicationEmailContext = {
  jobTitle: string;
  companyName: string;
  seekerName: string;
  employerUserId: string;
  employerEmail: string;
  seekerEmail: string;
  jobId: string;
};

export async function notifyApplicationSubmitted(ctx: ApplicationEmailContext) {
  await Promise.all([
    createNotification(
      ctx.employerUserId,
      "NEW_APPLICATION",
      `${ctx.seekerName} applied to "${ctx.jobTitle}".`
    ),
    sendEmail(
      ctx.employerEmail,
      `New applicant for ${ctx.jobTitle}`,
      `<p><strong>${ctx.seekerName}</strong> applied to your job <strong>${ctx.jobTitle}</strong>.</p>
       <p><a href="${appUrl}/employer/jobs/${ctx.jobId}/applicants">Review applicants</a></p>`
    ),
    sendEmail(
      ctx.seekerEmail,
      `Application submitted — ${ctx.jobTitle}`,
      `<p>Your application to <strong>${ctx.companyName}</strong> for <strong>${ctx.jobTitle}</strong> was received.</p>
       <p>We'll notify you when the employer updates your status.</p>`
    ),
  ]);
}

export async function notifyApplicationRejected(ctx: {
  seekerUserId: string;
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
  companyName: string;
  rejectionReason: string | null;
}) {
  const reasonBlock = ctx.rejectionReason
    ? `<p><strong>Feedback from the employer:</strong></p><p>${ctx.rejectionReason}</p>`
    : `<p>The employer did not include additional feedback.</p>`;

  await Promise.all([
    createNotification(
      ctx.seekerUserId,
      "APPLICATION_REJECTED",
      `Your application to ${ctx.companyName} for "${ctx.jobTitle}" was not selected.`
    ),
    sendEmail(
      ctx.seekerEmail,
      `Update on your application — ${ctx.jobTitle}`,
      `<p>Hi ${ctx.seekerName},</p>
       <p>Thank you for applying to <strong>${ctx.companyName}</strong> for the <strong>${ctx.jobTitle}</strong> role.</p>
       <p>After review, the employer has decided not to move forward with your application at this time.</p>
       ${reasonBlock}
       <p>You can continue browsing other opportunities on <a href="${appUrl}/jobs">EasyHire</a>.</p>`
    ),
  ]);
}
