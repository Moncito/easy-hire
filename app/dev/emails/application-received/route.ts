import { NextResponse } from "next/server";
import { renderApplicationReceivedEmail } from "@/lib/shared/email-layout";

/**
 * Local preview of the application-received email. 404s in production.
 * Open: http://localhost:3000/dev/emails/application-received
 */
export function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const html = renderApplicationReceivedEmail({
    preview: "Your application to The Black Saint Directory was received.",
    applicantFirstName: "Moncito",
    companyName: "The Black Saint Directory",
    jobTitle: "Full Stack PHP Developer | Work From Home",
    dashboardUrl: `${appUrl}/seeker/dashboard`,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
