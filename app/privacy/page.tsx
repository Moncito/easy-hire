import type { Metadata } from "next";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — EasyHire",
  description: "How EasyHire collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="Last updated: July 2026. This is an MVP draft — have legal counsel review before public launch."
    >
      <Section title="Overview">
        <p>
          EasyHire VA Solutions (&quot;EasyHire&quot;, &quot;we&quot;, &quot;us&quot;) operates a job board
          connecting virtual assistants in the Philippines with employers worldwide. This policy
          describes how we handle personal data when you use our platform.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          <strong>Account data:</strong> name, email address, password (hashed), and role
          (seeker or employer).
        </p>
        <p>
          <strong>Profile data:</strong> for seekers — skills, resume, work history, salary
          expectations; for employers — company name, industry, website, and company description.
        </p>
        <p>
          <strong>Application data:</strong> cover notes, application status, and employer
          evaluation notes.
        </p>
        <p>
          <strong>Usage data:</strong> standard server logs including IP address, browser type,
          and pages visited.
        </p>
      </Section>

      <Section title="How we use your information">
        <p>We use your data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Operate the job board and match seekers with employers</li>
          <li>Send transactional emails (application confirmations, status updates)</li>
          <li>Verify employer accounts and prevent fraud</li>
          <li>Improve platform security and performance</li>
        </ul>
      </Section>

      <Section title="Data sharing">
        <p>
          We do not sell personal data. We share information only with service providers necessary
          to operate the platform (hosting, email delivery, file storage) and when required by law.
        </p>
        <p>
          When you apply to a job, your profile and resume are shared with that employer. Employer
          company profiles are visible to seekers browsing job listings.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          We retain account and application data while your account is active. You may request
          account deletion by contacting us at privacy@easyhire.com.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, or delete your
          personal data. Philippine users may have additional rights under the Data Privacy Act of
          2012 (RA 10173). Contact privacy@easyhire.com to exercise these rights.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy:{" "}
          <a href="mailto:privacy@easyhire.com" className="text-teal hover:underline">
            privacy@easyhire.com
          </a>
        </p>
      </Section>
    </LegalPageShell>
  );
}
