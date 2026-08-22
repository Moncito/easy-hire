/** EasyHire transactional email tokens — inline-only, Gmail/Outlook safe. */
export const EMAIL = {
  navy: "#17365D",
  orange: "#F5A623",
  background: "#F4F6F8",
  white: "#FFFFFF",
  text: "#172033",
  muted: "#667085",
  success: "#16834D",
  border: "#E6E9EE",
  card: "#F7F8FA",
} as const;

const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

const FONT = "Arial,Helvetica,sans-serif";

export type EmailCta = {
  label: string;
  href: string;
};

type EmailLayoutInput = {
  preview?: string;
  heading: string;
  bodyHtml: string;
  cta?: EmailCta;
  badge?: string;
  footerNote?: string;
};

export function emailWordmark() {
  return `<span style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-0.03em;line-height:1;"><span style="color:${EMAIL.navy};">Easy</span><span style="color:${EMAIL.orange};">Hire</span></span>`;
}

export function emailCtaButton(cta: EmailCta) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" bgcolor="${EMAIL.orange}" style="border-radius:12px;">
          <a href="${cta.href}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:700;line-height:1.2;color:${EMAIL.text};text-decoration:none;">
            ${cta.label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function emailHeader(badge?: string) {
  const badgeCell = badge
    ? `<td align="right" valign="middle" style="padding:0;">
         <span style="display:inline-block;padding:5px 10px;border:1px solid ${EMAIL.border};border-radius:999px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.08em;color:${EMAIL.navy};background-color:${EMAIL.white};">
           ${badge}
         </span>
       </td>`
    : `<td></td>`;

  return `
    <tr>
      <td style="padding:0 0 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" style="padding:0;">${emailWordmark()}</td>
            ${badgeCell}
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function emailFooter(footerNote?: string) {
  return `
    <tr>
      <td style="padding:28px 8px 0;text-align:center;">
        <p style="margin:0 0 6px;font-family:${FONT};font-size:15px;font-weight:700;letter-spacing:-0.02em;">
          ${emailWordmark()}
        </p>
        <p style="margin:0 0 16px;font-family:${FONT};font-size:13px;line-height:1.5;color:${EMAIL.muted};font-style:italic;">
          Making hiring simpler, one opportunity at a time.
        </p>
        <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:1.55;color:${EMAIL.muted};">
          ${footerNote ?? "You're receiving this email because you have an EasyHire account."}
        </p>
        <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.55;color:${EMAIL.muted};">
          © 2026 EasyHire. All rights reserved.
        </p>
      </td>
    </tr>
  `;
}

function emailShell(preview: string | undefined, innerRows: string) {
  const previewText = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>EasyHire</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.background};">
  ${previewText}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL.background};">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          ${innerRows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Table-based transactional wrapper. Inline styles only — Gmail strips <style>.
 */
export function renderEmailLayout({
  preview,
  heading,
  bodyHtml,
  cta,
  badge,
  footerNote,
}: EmailLayoutInput): string {
  return emailShell(
    preview,
    `
      ${emailHeader(badge)}
      <tr>
        <td style="background-color:${EMAIL.white};border:1px solid ${EMAIL.border};border-radius:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:32px 28px 36px;">
                <h1 style="margin:0 0 16px;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:700;color:${EMAIL.text};">
                  ${heading}
                </h1>
                <div style="font-family:${FONT};font-size:15px;line-height:1.65;color:${EMAIL.text};">
                  ${bodyHtml}
                </div>
                ${cta ? `<div style="margin-top:28px;">${emailCtaButton(cta)}</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${emailFooter(footerNote)}
    `,
  );
}

export function emailDetailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${EMAIL.border};font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL.muted};width:96px;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${EMAIL.border};font-family:${FONT};font-size:15px;font-weight:600;color:${EMAIL.text};">
        ${value}
      </td>
    </tr>
  `;
}

function stackedDetail(label: string, valueHtml: string, last = false) {
  const border = last ? "none" : `1px solid ${EMAIL.border}`;
  return `
    <tr>
      <td style="padding:${last ? "14px 0 0" : "0 0 14px"};border-bottom:${border};">
        <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL.muted};">
          ${label}
        </p>
        <p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.4;font-weight:700;color:${EMAIL.text};">
          ${valueHtml}
        </p>
      </td>
    </tr>
  `;
}

function timelineStep(n: string, title: string, detail: string, last = false) {
  return `
    <tr>
      <td valign="top" width="36" style="padding:0 12px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="middle" width="28" height="28" bgcolor="${EMAIL.navy}" style="width:28px;height:28px;border-radius:14px;font-family:${FONT};font-size:12px;font-weight:700;color:${EMAIL.white};">
              ${n}
            </td>
          </tr>
        </table>
      </td>
      <td valign="top" style="padding:0 0 ${last ? "0" : "18px"};">
        <p style="margin:0 0 2px;font-family:${FONT};font-size:15px;font-weight:700;color:${EMAIL.text};">${title}</p>
        <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.5;color:${EMAIL.muted};">${detail}</p>
      </td>
    </tr>
  `;
}

/** Seeker application-received confirmation — used by notifyApplicationSubmitted. */
export function renderApplicationReceivedEmail(input: {
  preview: string;
  applicantFirstName: string;
  companyName: string;
  jobTitle: string;
  dashboardUrl: string;
}): string {
  const { preview, applicantFirstName, companyName, jobTitle, dashboardUrl } = input;

  return emailShell(
    preview,
    `
      ${emailHeader("APPLICATION")}
      <tr>
        <td style="background-color:${EMAIL.white};border:1px solid ${EMAIL.border};border-radius:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:36px 28px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                  <tr>
                    <td align="center" valign="middle" width="44" height="44" bgcolor="${EMAIL.success}" style="width:44px;height:44px;border-radius:22px;font-family:${FONT};font-size:20px;line-height:44px;font-weight:700;color:${EMAIL.white};">
                      ✓
                    </td>
                  </tr>
                </table>

                <h1 style="margin:0 0 16px;font-family:${FONT};font-size:26px;line-height:1.28;font-weight:700;color:${EMAIL.text};">
                  You're officially in the running.
                </h1>
                <p style="margin:0 0 8px;font-family:${FONT};font-size:16px;line-height:1.6;color:${EMAIL.text};">
                  Hi ${applicantFirstName},
                </p>
                <p style="margin:0 0 24px;font-family:${FONT};font-size:15px;line-height:1.65;color:${EMAIL.muted};">
                  Your application was successfully submitted through EasyHire. The employer now has your profile and can review it when they're ready.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;background-color:${EMAIL.card};border:1px solid ${EMAIL.border};border-radius:12px;">
                  <tr>
                    <td style="padding:20px 20px 18px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${stackedDetail("Company", companyName)}
                        ${stackedDetail("Position", jobTitle)}
                        ${stackedDetail(
                          "Status",
                          `<span style="color:${EMAIL.success};font-size:11px;">●</span>&nbsp;Application Received`,
                          true,
                        )}
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px;font-family:${FONT};font-size:16px;font-weight:700;color:${EMAIL.text};">
                  What happens next?
                </p>
                <p style="margin:0 0 18px;font-family:${FONT};font-size:14px;line-height:1.65;color:${EMAIL.muted};">
                  The employer will review your application and decide whether to move forward. We'll email you automatically when your application status changes.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
                  ${timelineStep("1", "Employer reviews your application", "Typically within a few days.")}
                  ${timelineStep("2", "You receive an update", "We'll notify you when your status changes.", true)}
                </table>

                ${emailCtaButton({
                  label: "View My Applications →",
                  href: dashboardUrl,
                })}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${emailFooter(
        "You're receiving this email because you have an EasyHire account and submitted an application.",
      )}
    `,
  );
}

export { appUrl as emailAppUrl };
