import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import BusinessDetails from "@/components/legal/BusinessDetails";
import { businessInfo, contractingPartyName } from "@/lib/legal/business-info";
import { currentLegalVersion } from "@/lib/legal/changelog";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms-version";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Privacy Policy",
  description: "How EasyHire collects, uses, and protects your personal information.",
};

const linkClass = "font-medium text-navy underline-offset-2 hover:underline";

const toc = [
  { id: "who-we-are", title: "Who we are" },
  { id: "information-we-collect", title: "Information we collect" },
  { id: "how-we-use", title: "How we use it, and why we are allowed to" },
  { id: "easy-ai", title: "Easy AI and automated processing" },
  { id: "who-can-see", title: "Who can see your information" },
  { id: "international-transfers", title: "International transfers" },
  { id: "retention", title: "How long we keep data" },
  { id: "security", title: "How we protect it" },
  { id: "your-rights", title: "Your rights" },
  { id: "cookies", title: "Cookies" },
  { id: "emails", title: "Emails" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact" },
];

const processors = [
  { name: "Vercel", purpose: "Website hosting and delivery" },
  { name: "Supabase", purpose: "Database and file storage (profiles, resumes, logos, verification documents)" },
  { name: "Upstash", purpose: "Rate limiting and short-lived caching" },
  { name: "Resend", purpose: "Sending account and notification emails" },
  { name: "Google", purpose: "Sign-in with Google, when you choose it" },
  { name: "OpenAI and/or Anthropic", purpose: "Processing text for Easy AI features" },
  { name: "PayMongo and Paddle", purpose: "Processing employer subscription payments" },
];

export default function PrivacyPage() {
  const privacyEmail = businessInfo.contact.privacy;
  const privacyMail = (
    <a href={`mailto:${privacyEmail}`} className={linkClass}>
      {privacyEmail}
    </a>
  );

  return (
    <LegalPageShell
      title="Privacy Policy"
      description={
        "How EasyHire collects, uses, and protects your personal information."
      }
      doc="privacy"
      toc={toc}
      updated={currentLegalVersion().effective}
      version={CURRENT_TERMS_VERSION}
      navSection="Privacy Policy"
      navIcon={Shield}
      navHint="Data & privacy"
    >
      <Section id="who-we-are" title="1. Who we are" summary="EasyHire is responsible for your data under the Philippine Data Privacy Act.">
        <p>
          {contractingPartyName()}{" "}
          (&quot;EasyHire&quot;, &quot;we&quot;, &quot;us&quot;) runs a job
          board connecting virtual assistants, mainly in the Philippines, with employers worldwide.
          We are the personal information controller for the data described here, and we handle it
          in line with the Data Privacy Act of 2012 (RA 10173), its implementing rules, and National
          Privacy Commission issuances.
        </p>
        <BusinessDetails />
        <p>
          Data Protection Officer{businessInfo.dpoName ? `: ${businessInfo.dpoName}` : ""} —{" "}
          {privacyMail}
        </p>
      </Section>

      <Section id="information-we-collect" title="2. Information we collect" summary="Account and profile details, documents you choose to upload, your activity on EasyHire, and basic technical data.">
        <p>
          <strong>Account data:</strong> name, email address, password (stored only as a one-way
          hash), role, sign-in method, two-factor settings (secrets are encrypted), and the date you
          accepted our Terms.
        </p>
        <p>
          <strong>Seeker profile data:</strong> headline, bio, photo, location, time zone, skills,
          languages, work history, education, certifications, links, availability, salary
          expectations, and resumes you upload.
        </p>
        <p>
          <strong>Employer data:</strong> company name, logo, industry, size, website, description,
          team members, and job posts.
        </p>
        <p>
          <strong>Verification documents:</strong> if you choose to verify, a government-issued ID
          (seekers) or business registration documents (employers). Government ID numbers are
          sensitive personal information; we collect them only with your consent, store them in a
          private bucket, and show them only to authorised reviewers.
        </p>
        <p>
          <strong>Activity on the platform:</strong> applications, application status history,
          messages, interviews, employer notes and ratings about candidates, reviews, reports, saved
          jobs, job alerts, and notification preferences.
        </p>
        <p>
          <strong>Billing data:</strong> plan, subscription status, and invoices. Card details are
          collected by our payment processors, not by us.
        </p>
        <p>
          <strong>Technical data:</strong> IP address, browser and device type, pages visited, and
          security events such as sign-ins and failed login attempts.
        </p>
        <p>
          Please do not put sensitive details such as government ID numbers, health information,
          religion, or bank details in your resume or messages unless an employer has a legitimate
          need for them.
        </p>
      </Section>

      <Section id="how-we-use" title="3. How we use it, and why we are allowed to" summary="To run the service, keep it safe, and bill employers. We never sell your data.">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>To provide the service you signed up for</strong> — accounts, profiles, job
            posts, applications, messaging, and notifications (contract).
          </li>
          <li>
            <strong>To keep EasyHire safe</strong> — verifying users, reviewing job posts,
            detecting scams, spam, and fake accounts, and computing internal trust signals that help
            our team prioritise reviews (legitimate interest).
          </li>
          <li>
            <strong>To process verification documents</strong> — only with your consent, which you
            can withdraw by deleting the document or your account.
          </li>
          <li>
            <strong>To bill employers</strong> for paid plans (contract, legal obligation).
          </li>
          <li>
            <strong>To improve the product</strong> using aggregated usage statistics (legitimate
            interest).
          </li>
          <li>
            <strong>To meet legal obligations</strong> — tax, accounting, and lawful requests from
            authorities.
          </li>
        </ul>
        <p>We do not sell personal data and we do not use it for third-party advertising.</p>
      </Section>

      <Section id="easy-ai" title="4. Easy AI and automated processing" summary="Some text is processed by AI providers to help employers. No one is rejected automatically.">
        <p>
          Easy AI features help employers draft job posts, summarise resumes, suggest candidate
          rankings, prepare interviews, and draft messages; we also use automated checks to flag
          likely spam. To do this, relevant text — such as a job description and the profile and
          application details of candidates for that job — is sent to an AI provider (OpenAI or
          Anthropic) for processing. Under their API terms, these providers do not use this data to
          train their models.
        </p>
        <p>
          AI output is a suggestion only. <strong>No candidate is rejected automatically</strong>;
          a person at the employer makes every hiring decision. If you would like to object to AI
          processing of your application, contact {privacyMail}.
        </p>
      </Section>

      <Section id="who-can-see" title="5. Who can see your information" summary="Employers you apply to, whoever your visibility setting allows, our team when needed, and vetted providers.">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Employers you apply to</strong> (and their team members on EasyHire) see your
            profile, resume, and application.
          </li>
          <li>
            <strong>Seeker profile visibility</strong> is your choice: <em>Hidden</em> (only
            employers you apply to), <em>Standard</em> (also discoverable by employers in talent
            search), or <em>Public</em> (also viewable on a public profile page). You can change it
            any time.
          </li>
          <li>
            <strong>Everyone</strong> can see published job posts, company profiles, and published
            reviews.
          </li>
          <li>
            <strong>Our team</strong> can access accounts where needed for review, support, and
            safety. Support access to an account is logged and limited to authorised staff.
          </li>
          <li>
            <strong>Service providers</strong> that process data on our behalf under contract:
          </li>
        </ul>
        <div className="overflow-hidden rounded-xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Provider</th>
                <th scope="col" className="px-4 py-2 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {processors.map((p) => (
                <tr key={p.name}>
                  <td className="px-4 py-2 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-2">{p.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          We may also disclose data when required by law or a valid order, to protect users from
          fraud or harm, or to a successor if EasyHire is sold or merged (in which case this policy
          continues to apply).
        </p>
      </Section>

      <Section id="international-transfers" title="6. International transfers">
        <p>
          Several of our service providers store or process data outside the Philippines, including
          in the United States and other countries. When this happens we rely on contractual
          safeguards with those providers and remain accountable for your data under the Data
          Privacy Act.
        </p>
      </Section>

      <Section id="retention" title="7. How long we keep data" summary="We keep data while your account is open and anonymise it when you delete your account.">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account and profile data: while your account is open.</li>
          <li>
            When you delete your account, we immediately remove or anonymise your personal details.
            Records another user legitimately relies on — such as an application an employer has
            already reviewed, or a shared message thread — are kept in anonymised form so their
            records stay consistent.
          </li>
          <li>Detailed activity and security logs: about 90 days, then kept only as aggregated statistics.</li>
          <li>Billing records: as long as tax and accounting law requires.</li>
          <li>
            Data an employer has downloaded is held by that employer under their own obligations.
          </li>
        </ul>
      </Section>

      <Section id="security" title="8. How we protect it">
        <p>
          We use encrypted connections, hashed passwords, encrypted two-factor secrets, private
          storage with short-lived signed links for resumes and documents, role-based access
          controls, rate limiting, and audit logs of administrative actions. No system is perfectly
          secure; if a personal data breach is likely to put you at risk, we will notify you and the
          National Privacy Commission within 72 hours of becoming aware of it, as the law requires.
        </p>
      </Section>

      <Section id="your-rights" title="9. Your rights" summary="Download or delete your data yourself, or email us for anything else.">
        <p>
          Under the Data Privacy Act you have the right to be informed, to access, to correct, to
          object, to erasure or blocking, to data portability, to claim damages, and to lodge a
          complaint. You can:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Download your data</strong> or <strong>delete your account</strong> yourself
            from your account settings.
          </li>
          <li>Edit most profile information and your profile visibility directly in the app.</li>
          <li>For anything else, email {privacyMail}. We respond within 30 days.</li>
          <li>
            If you are not satisfied with our response, you can complain to the National Privacy
            Commission at{" "}
            <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer" className={linkClass}>
              privacy.gov.ph
            </a>
            . Users outside the Philippines may also have rights under their local law.
          </li>
        </ul>
      </Section>

      <Section id="cookies" title="10. Cookies" summary="Essential cookies only. No ads or tracking.">
        <p>
          We only use cookies that are needed for the site to work: keeping you signed in,
          protecting forms against cross-site attacks, remembering your consent while you sign up
          with Google (for 10 minutes), and logging authorised support access. We do not use
          advertising or third-party analytics cookies. If that changes, we will update this policy
          and ask for your consent first.
        </p>
      </Section>

      <Section id="emails" title="11. Emails">
        <p>
          We send emails you need to use your account (verification, password resets, security
          alerts, interview scheduling). Other notifications, job alerts, and digests can be turned
          off in your settings or with the unsubscribe link in each email.
        </p>
      </Section>

      <Section id="children" title="12. Children">
        <p>
          EasyHire is only for people aged 18 and over. We do not knowingly collect data from
          anyone younger; if you believe we have, contact {privacyMail} and we will delete it.
        </p>
      </Section>

      <Section id="changes" title="13. Changes to this policy">
        <p>
          We will post any update here with a new &quot;Last updated&quot; date, and tell you by
          email or in the app about material changes before they apply. See also our{" "}
          <Link href="/terms" className={linkClass}>
            Terms of Service
          </Link>
          .
        </p>
      </Section>

      <Section id="contact" title="14. Contact">
        <p>Privacy questions and requests: {privacyMail}</p>
      </Section>
    </LegalPageShell>
  );
}
