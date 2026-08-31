import { describe, expect, it } from "vitest";
import { notificationHref } from "@/lib/shared/notifications";

describe("notificationHref", () => {
  it("defaults to employer destinations when no role is passed (back-compat for EmployerNotificationBell)", () => {
    expect(notificationHref("NEW_APPLICATION")).toBe("/employer/applicants");
    expect(notificationHref("NEW_MESSAGE")).toBe("/employer/messages");
    expect(notificationHref("SOME_UNKNOWN_TYPE")).toBe("/employer/dashboard");
  });

  it("maps employer notification types explicitly", () => {
    expect(notificationHref("NEW_APPLICATION", "EMPLOYER")).toBe("/employer/applicants");
    expect(notificationHref("NEW_MESSAGE", "EMPLOYER")).toBe("/employer/messages");
    expect(notificationHref("JOB_APPROVED", "EMPLOYER")).toBe("/employer/jobs");
    expect(notificationHref("JOB_REJECTED", "EMPLOYER")).toBe("/employer/jobs");
    expect(notificationHref("COMPANY_APPROVED", "EMPLOYER")).toBe("/employer/company-profile");
    expect(notificationHref("COMPANY_REJECTED", "EMPLOYER")).toBe("/employer/company-profile");
    expect(notificationHref("APPLICATION_WITHDRAWN", "EMPLOYER")).toBe("/employer/dashboard");
    expect(notificationHref("SCORECARD_SUBMITTED", "EMPLOYER")).toBe("/employer/dashboard");
  });

  it("maps seeker notification types to seeker-only routes", () => {
    expect(notificationHref("APPLICATION_REJECTED", "SEEKER")).toBe("/seeker/dashboard");
    expect(notificationHref("NEW_MESSAGE", "SEEKER")).toBe("/seeker/messages");
    expect(notificationHref("INTERVIEW_SCHEDULED", "SEEKER")).toBe("/seeker/dashboard");
  });

  it("never returns an /employer/* route for a seeker recipient", () => {
    const types = [
      "APPLICATION_REJECTED",
      "NEW_MESSAGE",
      "INTERVIEW_SCHEDULED",
      "NEW_APPLICATION",
      "JOB_APPROVED",
      "JOB_REJECTED",
      "COMPANY_APPROVED",
      "COMPANY_REJECTED",
      "APPLICATION_WITHDRAWN",
      "SCORECARD_SUBMITTED",
      "SOME_FUTURE_TYPE",
    ];
    for (const type of types) {
      const href = notificationHref(type, "SEEKER");
      expect(href?.startsWith("/employer")).toBe(false);
    }
  });

  it("falls back to the seeker dashboard for unknown types", () => {
    expect(notificationHref("SOME_FUTURE_TYPE", "SEEKER")).toBe("/seeker/dashboard");
  });
});
