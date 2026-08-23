import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/escape-html";
import { invalidateEmployerNotifications } from "@/lib/employer-cache";
import { emailDetailRow, renderApplicationReceivedEmail, renderEmailLayout } from "@/lib/shared/email-layout";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromAddress = process.env.EMAIL_FROM ?? "EasyHire <onboarding@resend.dev>";
const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipped:", subject, "→", to);
    return;
  }

  // onboarding@resend.dev can only deliver to the Resend account email.
  // Set EMAIL_TEST_RECIPIENT to that address until a domain is verified.
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim();
  const recipient = testRecipient || to;
  const testSubject =
    testRecipient && testRecipient.toLowerCase() !== to.toLowerCase()
      ? `[to: ${to}] ${subject}`
      : subject;

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: recipient,
    subject: testSubject,
    html,
  });

  if (error) {
    console.error("[email] send failed:", error);
  }
}

export async function createNotification(userId: string, type: string, message: string) {
  const notification = await prisma.notification.create({
    data: { userId, type, message },
  });
  invalidateEmployerNotifications(userId);
  return notification;
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
      renderEmailLayout({
        preview: `${ctx.seekerName} applied to ${ctx.jobTitle}.`,
        heading: "New applicant",
        bodyHtml: `
          <p style="margin:0 0 16px;">
            <strong>${escapeHtml(ctx.seekerName)}</strong> applied to your role.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
            ${emailDetailRow("Role", escapeHtml(ctx.jobTitle))}
          </table>
          <p style="margin:0;color:#5c6370;font-size:14px;">
            Review their profile and resume when you’re ready — nothing here is auto-decided.
          </p>
        `,
        cta: {
          label: "Review applicants",
          href: `${appUrl}/employer/jobs/${ctx.jobId}/applicants`,
        },
      })
    ),
    sendEmail(
      ctx.seekerEmail,
      `Application submitted — ${ctx.jobTitle}`,
      renderApplicationReceivedEmail({
        preview: `Your application to ${ctx.companyName} was received.`,
        applicantFirstName: escapeHtml(ctx.seekerName.split(/\s+/)[0] || ctx.seekerName),
        companyName: escapeHtml(ctx.companyName),
        jobTitle: escapeHtml(ctx.jobTitle),
        dashboardUrl: `${appUrl}/seeker/dashboard`,
      })
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
    ? `<p style="margin:0 0 8px;font-size:14px;"><strong>Feedback from the employer:</strong></p>
       <p style="margin:0;color:#5c6370;font-size:14px;">${escapeHtml(ctx.rejectionReason)}</p>`
    : `<p style="margin:0;color:#5c6370;font-size:14px;">The employer did not include additional feedback.</p>`;

  await Promise.all([
    createNotification(
      ctx.seekerUserId,
      "APPLICATION_REJECTED",
      `Your application to ${ctx.companyName} for "${ctx.jobTitle}" was not selected.`
    ),
    sendEmail(
      ctx.seekerEmail,
      `Update on your application — ${ctx.jobTitle}`,
      renderEmailLayout({
        preview: `Update on your application to ${ctx.companyName}.`,
        heading: "Application update",
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.seekerName)},</p>
          <p style="margin:0 0 16px;">
            Thank you for applying to <strong>${escapeHtml(ctx.companyName)}</strong> for
            <strong>${escapeHtml(ctx.jobTitle)}</strong>. After review, the employer has decided
            not to move forward at this time.
          </p>
          ${reasonBlock}
        `,
        cta: {
          label: "Browse other roles",
          href: `${appUrl}/jobs`,
        },
      })
    ),
  ]);
}

export async function sendJobAlertEmail(ctx: {
  to: string;
  seekerName: string;
  frequency: "DAILY" | "WEEKLY";
  jobs: Array<{ id: string; title: string; companyName: string; location: string }>;
}): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipped job alert digest");
    return false;
  }

  const list = ctx.jobs
    .slice(0, 10)
    .map(
      (j) =>
        `<li style="margin:0 0 8px;"><a href="${appUrl}/jobs/${j.id}" style="color:#1E3A5F;font-weight:700;text-decoration:none;"><strong>${escapeHtml(j.title)}</strong></a> — ${escapeHtml(j.companyName)} · ${escapeHtml(j.location)}</li>`
    )
    .join("");

  await sendEmail(
    ctx.to,
    `Your ${ctx.frequency.toLowerCase()} job alert — ${ctx.jobs.length} new match${ctx.jobs.length === 1 ? "" : "es"}`,
    renderEmailLayout({
      preview: `${ctx.jobs.length} new match${ctx.jobs.length === 1 ? "" : "es"} for your job alert.`,
      heading: "New roles for you",
      bodyHtml: `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.seekerName)},</p>
        <p style="margin:0 0 12px;">
          We found ${ctx.jobs.length} new job${ctx.jobs.length === 1 ? "" : "s"} matching your alert:
        </p>
        <ul style="margin:0;padding-left:18px;">${list}</ul>
      `,
      cta: {
        label: "Browse all jobs",
        href: `${appUrl}/jobs`,
      },
    })
  );
  return true;
}
