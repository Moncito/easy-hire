import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/escape-html";
import { invalidateEmployerNotifications } from "@/lib/employer-cache";
import { invalidateSeekerNotifications } from "@/lib/seeker/cache";
import { emailDetailRow, renderApplicationReceivedEmail, renderEmailLayout } from "@/lib/shared/email-layout";
import { generateInterviewIcs } from "@/lib/shared/calendar-invite";
import { formatInterviewWhenUtc, interviewFormatLabel } from "@/lib/shared/interview-format";
import { notificationHref, type NotificationRecipientRole } from "@/lib/shared/notifications";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromAddress = process.env.EMAIL_FROM ?? "EasyHire <onboarding@resend.dev>";
const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export type EmailAttachment = {
  filename: string;
  /**
   * Raw file contents — text (e.g. an .ics invite) or binary. `sendEmail`
   * base64-encodes this before handing it to Resend: the Node SDK's request
   * body goes through `JSON.stringify` with no Buffer/base64 conversion of
   * its own (see node_modules/resend/dist/index.cjs `parseAttachments`), so
   * an un-encoded value would serialize incorrectly over the wire.
   */
  content: string | Buffer;
  contentType?: string;
};

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
) {
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
    ...(attachments && attachments.length > 0
      ? {
          attachments: attachments.map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.isBuffer(attachment.content)
              ? attachment.content.toString("base64")
              : Buffer.from(attachment.content, "utf-8").toString("base64"),
            contentType: attachment.contentType,
          })),
        }
      : {}),
  });

  if (error) {
    console.error("[email] send failed:", error);
  }
}

export async function sendCollaborativeHiringInvitation(ctx: {
  to: string;
  companyName: string;
  role: string;
  token: string;
}) {
  const acceptUrl = `${appUrl}/invitations/${encodeURIComponent(ctx.token)}`;
  await sendEmail(
    ctx.to,
    `You’re invited to join ${ctx.companyName} on EasyHire`,
    renderEmailLayout({
      preview: `Join ${ctx.companyName}'s hiring workspace on EasyHire.`,
      heading: "You’re invited to the hiring team",
      bodyHtml: `
        <p style="margin:0 0 16px;">You’ve been invited to join <strong>${escapeHtml(ctx.companyName)}</strong> as a ${escapeHtml(ctx.role.replace(/_/g, " ").toLowerCase())}.</p>
        <p style="margin:0;color:#5c6370;font-size:14px;">This invitation is single-use and expires in 7 days. Sign in with this email address to accept it.</p>
      `,
      cta: { label: "Accept invitation", href: acceptUrl },
    })
  );
}

export async function sendPasswordResetEmail(ctx: { to: string; token: string }) {
  const resetUrl = `${appUrl}/reset-password/${encodeURIComponent(ctx.token)}`;
  await sendEmail(
    ctx.to,
    "Reset your EasyHire password",
    renderEmailLayout({
      preview: "Reset your EasyHire password.",
      heading: "Reset your password",
      bodyHtml: `
        <p style="margin:0 0 16px;">We received a request to reset the password on your EasyHire account.</p>
        <p style="margin:0;color:#5c6370;font-size:14px;">This link is single-use and expires in 1 hour. If you didn’t request this, you can safely ignore this email — your password won’t change.</p>
      `,
      cta: { label: "Reset password", href: resetUrl },
    })
  );
}

export async function sendEmailVerificationEmail(ctx: { to: string; token: string }) {
  const verifyUrl = `${appUrl}/api/auth/verify-email/${encodeURIComponent(ctx.token)}`;
  await sendEmail(
    ctx.to,
    "Verify your email address on EasyHire",
    renderEmailLayout({
      preview: "Verify your email address to finish setting up your EasyHire account.",
      heading: "Verify your email address",
      bodyHtml: `
        <p style="margin:0 0 16px;">Confirm this is your email address to finish setting up your EasyHire account.</p>
        <p style="margin:0;color:#5c6370;font-size:14px;">This link expires in 24 hours. If you didn’t create an EasyHire account, you can safely ignore this email.</p>
      `,
      cta: { label: "Verify email", href: verifyUrl },
    })
  );
}

// ============================================================================
// WELCOME — folded into the first verification email, never sent alongside it
// ============================================================================
// Registration already fires one email (sendEmailVerificationEmail, via
// requestEmailVerification). Sending a second "Welcome to EasyHire" email
// right after it would just repeat the same "get started" message twice in
// the same inbox in the same minute. Instead, app/api/register/route.ts
// calls sendWelcomeVerificationEmail below (see lib/auth/credentials-recovery.ts
// → issueEmailVerificationToken / sendWelcomeVerificationEmail), a distinct
// template that folds the welcome copy into the one verify-your-email
// message a brand-new account actually needs. requestEmailVerification's
// own plain "Verify your email address" template (used for resends from an
// existing, already-onboarded account) is untouched.
export async function sendWelcomeVerificationEmail(ctx: {
  to: string;
  token: string;
  role: "SEEKER" | "EMPLOYER" | "ADMIN";
}) {
  const verifyUrl = `${appUrl}/api/auth/verify-email/${encodeURIComponent(ctx.token)}`;
  const roleSentence =
    ctx.role === "EMPLOYER"
      ? "post your first role and start hearing from great Virtual Assistants"
      : "start browsing roles and applying with a saved profile";

  await sendEmail(
    ctx.to,
    "Welcome to EasyHire — verify your email to get started",
    renderEmailLayout({
      preview: "Welcome to EasyHire! Verify your email to activate your account.",
      heading: "Welcome to EasyHire",
      bodyHtml: `
        <p style="margin:0 0 16px;">Your account is created — one step left.</p>
        <p style="margin:0 0 16px;">
          Confirm this is your email address and you'll be ready to ${roleSentence}.
        </p>
        <p style="margin:0;color:#5c6370;font-size:14px;">This link expires in 24 hours. If you didn't create an EasyHire account, you can safely ignore this email.</p>
      `,
      cta: { label: "Verify email & get started", href: verifyUrl },
    })
  );
}

export async function createNotification(userId: string, type: string, message: string) {
  const notification = await prisma.notification.create({
    data: { userId, type, message },
  });
  // The recipient's role isn't known here, and both tags are cheap no-ops
  // when the other cache instance was never populated.
  invalidateEmployerNotifications(userId);
  invalidateSeekerNotifications(userId);
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

// ============================================================================
// INTERVIEW NOTIFICATIONS — scheduled / rescheduled / cancelled
// ============================================================================
// The candidate never sees interview data anywhere in the product except
// these emails and the read-only summary in lib/seeker/dashboard.ts
// (getSeekerInterviews). Never include InterviewParticipant.notes, outcome,
// or scorecard data here — those are the employer's private hiring notes.

type InterviewEmailContext = {
  interviewId: string;
  seekerUserId: string;
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date;
  durationMins: number;
  format: string;
  location: string | null;
  organizerEmail: string;
  /** iCalendar SEQUENCE for this send — see lib/shared/calendar-invite.ts. */
  sequence: number;
};

function interviewIcsAttachment(ctx: InterviewEmailContext, method: "REQUEST" | "CANCEL") {
  const ics = generateInterviewIcs({
    interviewId: ctx.interviewId,
    sequence: ctx.sequence,
    method,
    scheduledAt: ctx.scheduledAt,
    durationMins: ctx.durationMins,
    summary: `Interview: ${ctx.jobTitle} at ${ctx.companyName}`,
    description: `${interviewFormatLabel(ctx.format)} interview for ${ctx.jobTitle} at ${ctx.companyName}.`,
    location: ctx.location ?? undefined,
    organizerEmail: ctx.organizerEmail,
    organizerName: ctx.companyName,
    attendeeEmail: ctx.seekerEmail,
    attendeeName: ctx.seekerName,
  });
  return {
    filename: "interview.ics",
    content: ics,
    contentType: `text/calendar; method=${method}; charset=utf-8`,
  };
}

function interviewDetailRows(ctx: InterviewEmailContext) {
  return `
    ${emailDetailRow("Company", escapeHtml(ctx.companyName))}
    ${emailDetailRow("Role", escapeHtml(ctx.jobTitle))}
    ${emailDetailRow("When", escapeHtml(formatInterviewWhenUtc(ctx.scheduledAt)))}
    ${emailDetailRow("Duration", `${ctx.durationMins} minutes`)}
    ${emailDetailRow("Format", escapeHtml(interviewFormatLabel(ctx.format)))}
    ${ctx.location ? emailDetailRow("Location", escapeHtml(ctx.location)) : ""}
  `;
}

/** Called from scheduleInterview (lib/collaborative-interviews.ts) — fire-and-forget, a mail failure must never break scheduling. */
export async function notifyInterviewScheduled(ctx: InterviewEmailContext) {
  await Promise.all([
    createNotification(
      ctx.seekerUserId,
      "INTERVIEW_SCHEDULED",
      `${ctx.companyName} scheduled an interview with you for "${ctx.jobTitle}" on ${formatInterviewWhenUtc(ctx.scheduledAt)}.`
    ),
    sendEmail(
      ctx.seekerEmail,
      `Interview scheduled — ${ctx.jobTitle}`,
      renderEmailLayout({
        preview: `Your interview with ${ctx.companyName} is confirmed.`,
        heading: "Interview scheduled",
        badge: "INTERVIEW",
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.seekerName)},</p>
          <p style="margin:0 0 16px;">
            <strong>${escapeHtml(ctx.companyName)}</strong> has scheduled an interview with you for
            <strong>${escapeHtml(ctx.jobTitle)}</strong>.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
            ${interviewDetailRows(ctx)}
          </table>
          <p style="margin:0;color:#5c6370;font-size:14px;">
            A calendar invite is attached — add it to your calendar so you don't miss it.
          </p>
        `,
        cta: { label: "View my applications", href: `${appUrl}/seeker/dashboard` },
      }),
      [interviewIcsAttachment(ctx, "REQUEST")]
    ),
  ]);
}

/** Called when an existing interview's time changes — fire-and-forget, same rules as notifyInterviewScheduled. */
export async function notifyInterviewRescheduled(
  ctx: InterviewEmailContext & { previousScheduledAt: Date }
) {
  await sendEmail(
    ctx.seekerEmail,
    `Interview rescheduled — ${ctx.jobTitle}`,
    renderEmailLayout({
      preview: `Your interview with ${ctx.companyName} moved to a new time.`,
      heading: "Interview rescheduled",
      badge: "INTERVIEW",
      bodyHtml: `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.seekerName)},</p>
        <p style="margin:0 0 16px;">
          <strong>${escapeHtml(ctx.companyName)}</strong> moved your interview for
          <strong>${escapeHtml(ctx.jobTitle)}</strong> to a new time.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
          ${emailDetailRow("Previous time", `<span style="text-decoration:line-through;color:#8b93a1;">${escapeHtml(formatInterviewWhenUtc(ctx.previousScheduledAt))}</span>`)}
          ${interviewDetailRows(ctx)}
        </table>
        <p style="margin:0;color:#5c6370;font-size:14px;">
          The attached calendar invite updates your existing entry — you don't need to delete the old one.
        </p>
      `,
      cta: { label: "View my applications", href: `${appUrl}/seeker/dashboard` },
    }),
    [interviewIcsAttachment(ctx, "REQUEST")]
  );
}

/** Called from the interview cancel path — fire-and-forget, same rules as notifyInterviewScheduled. No .ics attachment (see task scope: only scheduled/rescheduled emails carry the calendar file). */
export async function notifyInterviewCancelled(ctx: InterviewEmailContext) {
  await sendEmail(
    ctx.seekerEmail,
    `Interview cancelled — ${ctx.jobTitle}`,
    renderEmailLayout({
      preview: `Your interview with ${ctx.companyName} was cancelled.`,
      heading: "Interview cancelled",
      badge: "INTERVIEW",
      bodyHtml: `
        <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.seekerName)},</p>
        <p style="margin:0 0 16px;">
          <strong>${escapeHtml(ctx.companyName)}</strong> cancelled your interview for
          <strong>${escapeHtml(ctx.jobTitle)}</strong>, previously scheduled for
          ${escapeHtml(formatInterviewWhenUtc(ctx.scheduledAt))}.
        </p>
        <p style="margin:0;color:#5c6370;font-size:14px;">
          If you were expecting a new time, keep an eye on your inbox — the employer may reach out to reschedule.
        </p>
      `,
      cta: { label: "View my applications", href: `${appUrl}/seeker/dashboard` },
    })
  );
}

// ============================================================================
// ADMIN REVIEW — job approved/rejected, company verified/rejected
// ============================================================================
// Email-only (the JOB_APPROVED / JOB_REJECTED / COMPANY_APPROVED /
// COMPANY_REJECTED Notification rows are created inside the same
// prisma.$transaction as the status update in lib/admin/jobs.ts and
// lib/admin/companies.ts, so they stay atomic with it). These are called
// fire-and-forget, after that transaction commits.

export async function sendJobApprovedEmail(ctx: {
  to: string;
  companyName: string;
  jobTitle: string;
}) {
  await sendEmail(
    ctx.to,
    `Your job "${ctx.jobTitle}" is live`,
    renderEmailLayout({
      preview: `${ctx.jobTitle} is now live on the EasyHire job board.`,
      heading: "Your job is live",
      badge: "JOB",
      bodyHtml: `
        <p style="margin:0 0 16px;">
          Good news — <strong>${escapeHtml(ctx.jobTitle)}</strong> passed review and is now visible to job seekers on the public job board.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
          ${emailDetailRow("Company", escapeHtml(ctx.companyName))}
          ${emailDetailRow("Role", escapeHtml(ctx.jobTitle))}
        </table>
        <p style="margin:0;color:#5c6370;font-size:14px;">
          Applicants can apply starting now — check your dashboard for new activity.
        </p>
      `,
      cta: { label: "View my jobs", href: `${appUrl}${notificationHref("JOB_APPROVED", "EMPLOYER")}` },
    })
  );
}

export async function sendJobRejectedEmail(ctx: {
  to: string;
  companyName: string;
  jobTitle: string;
  reason: string;
}) {
  await sendEmail(
    ctx.to,
    `Your job "${ctx.jobTitle}" needs changes`,
    renderEmailLayout({
      preview: `${ctx.jobTitle} was not approved — see what to fix.`,
      heading: "Your job needs changes",
      badge: "JOB",
      bodyHtml: `
        <p style="margin:0 0 16px;">
          <strong>${escapeHtml(ctx.jobTitle)}</strong> was reviewed and was not approved for the public job board.
        </p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Reviewer feedback:</strong></p>
        <p style="margin:0 0 16px;color:#5c6370;font-size:14px;">${escapeHtml(ctx.reason)}</p>
        <p style="margin:0;color:#5c6370;font-size:14px;">
          Update the listing and resubmit it for review whenever you're ready.
        </p>
      `,
      cta: { label: "Review my jobs", href: `${appUrl}${notificationHref("JOB_REJECTED", "EMPLOYER")}` },
    })
  );
}

export async function sendCompanyVerifiedEmail(ctx: { to: string; companyName: string }) {
  await sendEmail(
    ctx.to,
    "Your company is verified on EasyHire",
    renderEmailLayout({
      preview: `${ctx.companyName} is now verified on EasyHire.`,
      heading: "Company verified",
      badge: "COMPANY",
      bodyHtml: `
        <p style="margin:0 0 16px;">
          <strong>${escapeHtml(ctx.companyName)}</strong> is now a verified employer on EasyHire.
        </p>
        <p style="margin:0;color:#5c6370;font-size:14px;">
          Approved job listings you publish from here on are visible to job seekers on the public board.
        </p>
      `,
      cta: {
        label: "Go to company profile",
        href: `${appUrl}${notificationHref("COMPANY_APPROVED", "EMPLOYER")}`,
      },
    })
  );
}

export async function sendCompanyRejectedEmail(ctx: {
  to: string;
  companyName: string;
  reason: string;
}) {
  await sendEmail(
    ctx.to,
    "Your company verification needs attention",
    renderEmailLayout({
      preview: `${ctx.companyName} was not verified — see what to fix.`,
      heading: "Verification needs attention",
      badge: "COMPANY",
      bodyHtml: `
        <p style="margin:0 0 16px;">
          Your company <strong>${escapeHtml(ctx.companyName)}</strong> was reviewed and was not verified.
        </p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Reviewer feedback:</strong></p>
        <p style="margin:0 0 16px;color:#5c6370;font-size:14px;">${escapeHtml(ctx.reason)}</p>
        <p style="margin:0;color:#5c6370;font-size:14px;">
          Update your company profile and documents, then contact support to request another review.
        </p>
      `,
      cta: {
        label: "Update company profile",
        href: `${appUrl}${notificationHref("COMPANY_REJECTED", "EMPLOYER")}`,
      },
    })
  );
}

// ============================================================================
// APPLICATION STATUS CHANGED — shortlisted / interview / hired
// ============================================================================
// APPLICATION_REJECTED already has its own notify+email pair
// (notifyApplicationRejected above); this covers every other status an
// employer can move an application to. Bundles the Notification write with
// the email the same way notifyApplicationRejected does, since — unlike the
// admin review actions above — there was no existing createNotification
// call for this transition in lib/jobs/applications.ts to preserve.

const APPLICATION_STATUS_COPY = {
  SHORTLISTED: {
    subject: "You've been shortlisted",
    heading: "You've been shortlisted",
    sentence: "shortlisted your application",
  },
  INTERVIEW: {
    subject: "You've moved to the interview stage",
    heading: "Interview stage",
    sentence: "moved your application to the interview stage",
  },
  HIRED: {
    subject: "Congratulations — you got the job",
    heading: "You got the job",
    sentence: "decided to hire you",
  },
} as const;

export type NonRejectionApplicationStatus = keyof typeof APPLICATION_STATUS_COPY;

export async function notifyApplicationStatusChanged(ctx: {
  seekerUserId: string;
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
  companyName: string;
  status: NonRejectionApplicationStatus;
}) {
  const copy = APPLICATION_STATUS_COPY[ctx.status];

  await Promise.all([
    createNotification(
      ctx.seekerUserId,
      "APPLICATION_STATUS_CHANGED",
      `${ctx.companyName} ${copy.sentence} for "${ctx.jobTitle}".`
    ),
    sendEmail(
      ctx.seekerEmail,
      `${copy.subject} — ${ctx.jobTitle}`,
      renderEmailLayout({
        preview: `${ctx.companyName} ${copy.sentence} for ${ctx.jobTitle}.`,
        heading: copy.heading,
        badge: "APPLICATION",
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${escapeHtml(ctx.seekerName)},</p>
          <p style="margin:0 0 16px;">
            <strong>${escapeHtml(ctx.companyName)}</strong> ${copy.sentence} for
            <strong>${escapeHtml(ctx.jobTitle)}</strong>.
          </p>
          <p style="margin:0;color:#5c6370;font-size:14px;">
            Check your dashboard for the latest on this application.
          </p>
        `,
        cta: {
          label: "View my applications",
          href: `${appUrl}${notificationHref("APPLICATION_STATUS_CHANGED", "SEEKER")}`,
        },
      })
    ),
  ]);
}

// ============================================================================
// NEW MESSAGE — throttled, see lib/messaging/message-notify.ts
// ============================================================================
// The NEW_MESSAGE Notification row is created at the call site (unchanged —
// lib/messaging/messages.ts and lib/collaborative-messages.ts already do
// this for every message). This only sends the email, and only when the
// caller has already determined (via shouldSendNewMessageEmail) that this
// is the recipient's first unread message in the conversation.

export async function sendNewMessageEmail(ctx: {
  to: string;
  recipientRole: NotificationRecipientRole;
  senderName: string;
}) {
  const href = `${appUrl}${notificationHref("NEW_MESSAGE", ctx.recipientRole)}`;
  await sendEmail(
    ctx.to,
    `New message from ${ctx.senderName}`,
    renderEmailLayout({
      preview: `${ctx.senderName} sent you a new message on EasyHire.`,
      heading: "New message",
      badge: "MESSAGE",
      bodyHtml: `
        <p style="margin:0 0 16px;">
          <strong>${escapeHtml(ctx.senderName)}</strong> sent you a new message on EasyHire.
        </p>
        <p style="margin:0;color:#5c6370;font-size:14px;">
          Reply from your inbox — we'll only email you again once you've caught up on unread messages in this conversation.
        </p>
      `,
      cta: { label: "Open conversation", href },
    })
  );
}
