import type { Metadata } from "next";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service — EasyHire",
  description: "Terms governing use of the EasyHire job board platform.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description="Last updated: July 2026. This is an MVP draft — have legal counsel review before public launch."
    >
      <Section title="Agreement">
        <p>
          By accessing EasyHire, you agree to these Terms. EasyHire is a self-service job board —
          we connect employers and virtual assistants but do not employ, place, or source
          candidates on behalf of employers.
        </p>
      </Section>

      <Section title="Eligibility">
        <p>
          You must be at least 18 years old. Seekers must be legally eligible to work as
          independent contractors or employees in their jurisdiction. Employers must represent a
          legitimate business entity.
        </p>
      </Section>

      <Section title="Employer responsibilities">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide accurate company and job posting information</li>
          <li>Review applications in good faith and respond to candidates promptly</li>
          <li>Comply with applicable labour and tax laws in your jurisdiction</li>
          <li>Never charge job seekers fees to apply or be considered</li>
          <li>Not use the platform for scams, spam, or discriminatory hiring practices</li>
        </ul>
      </Section>

      <Section title="Seeker responsibilities">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide truthful profile information and an accurate resume</li>
          <li>Apply only to roles you are genuinely interested in and qualified for</li>
          <li>Communicate professionally with employers through the platform</li>
        </ul>
      </Section>

      <Section title="Job postings and approval">
        <p>
          All job postings are subject to admin review before becoming publicly visible. EasyHire
          reserves the right to reject or remove any posting that violates these terms or appears
          fraudulent.
        </p>
      </Section>

      <Section title="Fees">
        <p>
          During the MVP validation period, basic job posting, applicant management, and
          in-platform messaging are free for employers. See our{" "}
          <a href="/pricing" className="text-teal hover:underline">
            Pricing page
          </a>{" "}
          for current details. We will provide advance notice before introducing paid features.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          EasyHire is provided &quot;as is.&quot; We are not responsible for hiring decisions,
          employment relationships, payment disputes, or outcomes between employers and seekers.
          Our liability is limited to the maximum extent permitted by law.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms:{" "}
          <a href="mailto:legal@easyhire.com" className="text-teal hover:underline">
            legal@easyhire.com
          </a>
        </p>
      </Section>
    </LegalPageShell>
  );
}
