import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import BusinessDetails from "@/components/legal/BusinessDetails";
import { businessInfo, contractingPartyName } from "@/lib/legal/business-info";
import { currentLegalVersion } from "@/lib/legal/changelog";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms-version";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Terms of Service",
  description: "Terms governing use of the EasyHire job board platform.",
};

const linkClass = "font-medium text-navy underline-offset-2 hover:underline";

const toc = [
  { id: "about", title: "About these Terms" },
  { id: "what-easyhire-is", title: "What EasyHire is — and is not" },
  { id: "eligibility", title: "Eligibility and accounts" },
  { id: "employer-responsibilities", title: "Employer responsibilities" },
  { id: "seeker-responsibilities", title: "Seeker responsibilities" },
  { id: "prohibited-conduct", title: "Prohibited conduct" },
  { id: "moderation", title: "Job posts, verification, and moderation" },
  { id: "your-content", title: "Your content" },
  { id: "easy-ai", title: "Easy AI and automated features" },
  { id: "billing", title: "Paid plans, billing, and refunds" },
  { id: "termination", title: "Suspension and termination" },
  { id: "intellectual-property", title: "Our intellectual property" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "governing-law", title: "Governing law and disputes" },
  { id: "changes", title: "Changes to these Terms" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  const party = contractingPartyName();
  const venue = businessInfo.venueCity
    ? `the proper courts of ${businessInfo.venueCity}, Philippines`
    : "the proper courts of the Philippines";

  return (
    <LegalPageShell
      title="Terms of Service"
      description={
        "The agreement between you and EasyHire for using the platform."
      }
      doc="terms"
      toc={toc}
      updated={currentLegalVersion().effective}
      version={CURRENT_TERMS_VERSION}
      navSection="Terms of Service"
      navIcon={FileText}
      navHint="Platform agreement"
    >
      <Section id="about" title="1. About these Terms" summary="This is the agreement between you and EasyHire. Using the site means you accept it.">
        <p>
          These Terms of Service (&quot;Terms&quot;) are an agreement between you and {party}{" "}
          (&quot;EasyHire&quot;, &quot;we&quot;, &quot;us&quot;), the operator of the EasyHire
          website and services. By creating an account or using EasyHire, you agree to these Terms
          and to our{" "}
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          . If you do not agree, do not use EasyHire.
        </p>
        <BusinessDetails />
      </Section>

      <Section id="what-easyhire-is" title="2. What EasyHire is — and is not" summary="We're a job board, not a recruitment agency or employer. Seekers never pay us.">
        <p>
          EasyHire is a self-service online job board that lets employers post roles and lets
          virtual assistants (&quot;seekers&quot;) find and apply to them. We provide the software;
          employers and seekers deal with each other directly.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            We are <strong>not</strong> a recruitment or placement agency, and we do not recruit,
            select, place, or deploy workers on anyone&apos;s behalf.
          </li>
          <li>
            We are <strong>not</strong> the employer or client of any seeker, and we are not a party
            to any engagement, contract, or payment between an employer and a seeker.
          </li>
          <li>
            We do not guarantee that a job will be filled, that an applicant will be hired, or that
            any user is who they claim to be, even where a verification badge is shown.
          </li>
          <li>
            <strong>Seekers never pay EasyHire</strong> to create a profile, apply, or be contacted.
            Our fees are charged to employers only.
          </li>
        </ul>
      </Section>

      <Section id="eligibility" title="3. Eligibility and accounts" summary="You must be 18 or older, give accurate details, and keep your login safe.">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must be at least 18 years old and able to enter into a binding contract.</li>
          <li>
            Employers must represent a real business or individual hiring for a genuine role, and
            the person creating an employer account must be authorised to act for that business.
          </li>
          <li>
            Keep your account information accurate and your login secure. You are responsible for
            activity on your account. Tell us promptly at{" "}
            <a href={`mailto:${businessInfo.contact.general}`} className={linkClass}>
              {businessInfo.contact.general}
            </a>{" "}
            if you suspect unauthorised access.
          </li>
          <li>One person may not hold multiple accounts of the same type to evade a suspension or limit.</li>
        </ul>
      </Section>

      <Section id="employer-responsibilities" title="4. Employer responsibilities" summary="Post real jobs, never charge seekers, don't discriminate, and protect applicant data.">
        <ul className="list-disc space-y-2 pl-5">
          <li>Post only real, currently open roles with accurate pay, hours, and duties.</li>
          <li>
            Do not charge, or ask anyone else to charge, seekers any fee, deposit, training cost, or
            equipment purchase to apply or be hired.
          </li>
          <li>
            Do not state preferences or requirements based on age, sex, gender, civil status,
            religion, ethnicity, disability, or other protected characteristics, except where
            genuinely required by the job and allowed by law. In the Philippines this includes the
            Anti-Age Discrimination in Employment Act (RA 10911), the Magna Carta of Women (RA 9710),
            and the Magna Carta for Persons with Disability (RA 7277).
          </li>
          <li>
            Comply with the labour, tax, and contracting laws that apply to the engagements you
            offer. You are responsible for how you classify and pay the people you hire.
          </li>
          <li>
            Use applicant information only to evaluate candidates for your roles, keep it secure,
            and delete it when no longer needed. Once you download or copy applicant data, you are
            responsible for it as a personal information controller under the Data Privacy Act of
            2012 (RA 10173) and any other law that applies to you.
          </li>
          <li>Treat candidates professionally and respond in good faith.</li>
        </ul>
      </Section>

      <Section id="seeker-responsibilities" title="5. Seeker responsibilities" summary="Be truthful, apply genuinely, and never pay anyone to get hired.">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide truthful profile information, work history, and documents.</li>
          <li>Apply only to roles you are genuinely interested in and qualified for.</li>
          <li>Communicate professionally with employers.</li>
          <li>
            Do not include government ID numbers, bank details, health information, or other
            sensitive details in your resume or messages unless an employer has a legitimate need
            for them. Never pay an employer to be hired — report anyone who asks.
          </li>
        </ul>
      </Section>

      <Section id="prohibited-conduct" title="6. Prohibited conduct" summary="No scams, illegal work, impersonation, harassment, scraping, or fake reviews.">
        <p>You may not use EasyHire to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Post or promote scams, pyramid or multi-level marketing schemes, or &quot;jobs&quot; that require payment from the worker</li>
          <li>Offer illegal work, adult or sexual services, gambling, or anything unlawful where it is performed</li>
          <li>Impersonate another person or business, or submit forged or altered documents</li>
          <li>Harass, threaten, or discriminate against anyone, or send spam or unsolicited bulk messages</li>
          <li>Collect user data for purposes other than hiring on EasyHire, including scraping, crawling, or bulk export outside the features we provide</li>
          <li>Post fake or incentivised reviews, or review someone you have not dealt with</li>
          <li>Probe, overload, or circumvent the security, rate limits, or access controls of the service</li>
          <li>Upload malware or content that infringes someone else&apos;s rights</li>
        </ul>
      </Section>

      <Section id="moderation" title="7. Job posts, verification, and moderation" summary="Free-plan posts are reviewed before going live. We can remove anything that breaks the rules.">
        <p>
          Job posts from employers on the Free plan are reviewed by our team before they are
          published. Employers on Employer Pro whose company has passed our verification may
          publish immediately, but those posts remain subject to the same rules and may be reviewed
          or removed at any time.
        </p>
        <p>
          We may ask employers and seekers to verify their identity or business, for example by
          uploading a registration certificate or government-issued ID. Verification reduces risk
          but does not guarantee anyone&apos;s identity, conduct, or trustworthiness.
        </p>
        <p>
          We may reject, edit for formatting, unpublish, or remove any post, profile, message,
          or review that we reasonably believe breaks these Terms or the law, or that puts users at
          risk. You can report content using the report buttons in the app.
        </p>
      </Section>

      <Section id="your-content" title="8. Your content" summary="You own what you upload. You let us host and show it so the service works.">
        <p>
          You keep ownership of what you upload — profiles, resumes, logos, job posts, messages, and
          reviews. You give us a non-exclusive, worldwide, royalty-free licence to host, store,
          copy, display, and process that content as needed to run, secure, and promote EasyHire
          (for example, showing a public job post or a profile you have made visible). This licence
          ends when the content is deleted, except for copies we must keep under our{" "}
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>{" "}
          or the law, and content already shared with another user.
        </p>
        <p>
          You confirm you have the right to share your content and that it does not infringe
          anyone else&apos;s rights. If you believe content on EasyHire infringes your rights, email{" "}
          <a href={`mailto:${businessInfo.contact.legal}`} className={linkClass}>
            {businessInfo.contact.legal}
          </a>
          .
        </p>
      </Section>

      <Section id="easy-ai" title="9. Easy AI and automated features" summary="AI makes suggestions. People make every hiring decision.">
        <p>
          Some features use artificial intelligence — for example drafting job descriptions,
          summarising resumes, suggesting candidate rankings, preparing interview questions, and
          flagging likely spam. AI output can be wrong or incomplete. It is a suggestion only:
          EasyHire never rejects a candidate automatically, and employers remain fully responsible
          for their hiring decisions and for reviewing AI output before relying on it. See the{" "}
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>{" "}
          for how data is used in these features.
        </p>
      </Section>

      <Section id="billing" title="10. Paid plans, billing, and refunds" summary="Employer Pro renews automatically until you cancel. Cancelling stops the next renewal.">
        <p>
          Core features are free. Employer Pro is an optional paid subscription; current features
          and prices are on our{" "}
          <Link href="/pricing" className={linkClass}>
            Pricing page
          </Link>
          . Where paid plans are offered:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Subscriptions are billed in advance for each billing period and <strong>renew
            automatically</strong> until cancelled. You can cancel at any time from your billing
            settings; cancellation takes effect at the end of the current paid period and you keep
            Pro features until then.
          </li>
          <li>
            Fees already paid are non-refundable, including for partly used periods, except where
            required by law or where we end your subscription without cause, in which case we refund
            the unused portion.
          </li>
          <li>
            Payments from the Philippines are processed by PayMongo. Payments from outside the
            Philippines are processed by Paddle.com, which acts as the merchant of record and
            reseller for those orders; Paddle&apos;s buyer terms also apply to those purchases and
            Paddle handles related refunds, taxes, and invoices. We never see or store your full
            card details.
          </li>
          <li>
            Prices may change. We will give at least 30 days&apos; notice of a price increase before
            it applies to your next renewal, and you can cancel before it takes effect.
          </li>
          <li>Prices exclude taxes unless stated; applicable taxes are added at checkout.</li>
        </ul>
      </Section>

      <Section id="termination" title="11. Suspension and termination" summary="You can leave anytime. We can suspend accounts that break these Terms.">
        <p>
          You can stop using EasyHire at any time and delete your account from your account
          settings. We may suspend or close an account, or limit features, if we reasonably believe
          it breaks these Terms or the law, creates risk for other users, or is needed to
          investigate fraud or abuse. Where it is safe and lawful to do so, we will tell you why and
          give you a way to respond. Sections that by their nature should survive termination
          (including 8, 13–16) continue to apply.
        </p>
      </Section>

      <Section id="intellectual-property" title="12. Our intellectual property">
        <p>
          The EasyHire name, logo, software, and site design belong to us or our licensors. These
          Terms do not give you any right to use them except to use the service as intended. If you
          send us feedback, we may use it without obligation to you.
        </p>
      </Section>

      <Section id="disclaimers" title="13. Disclaimers">
        <p>
          EasyHire is provided &quot;as is&quot; and &quot;as available&quot;. To the extent
          permitted by law, we make no warranties about the accuracy of job posts, profiles, or AI
          output, the conduct of any user, or uninterrupted or error-free operation. You are
          responsible for your own checks before entering into any engagement.
        </p>
      </Section>

      <Section id="liability" title="14. Limitation of liability" summary="Our liability is capped at what you paid us in the last 12 months, or PHP 5,000.">
        <p>
          To the extent permitted by law, EasyHire is not liable for indirect, incidental, or
          consequential losses, lost profits or wages, or for any dispute, payment, or relationship
          between employers and seekers. Our total liability for any claim relating to EasyHire is
          limited to the amount you paid us in the 12 months before the claim arose, or PHP 5,000 if
          you paid nothing. Nothing in these Terms limits liability that cannot be limited by law,
          including for fraud, gross negligence, or wilful misconduct.
        </p>
      </Section>

      <Section id="indemnity" title="15. Indemnity">
        <p>
          You agree to indemnify EasyHire against claims, losses, and reasonable costs arising from
          your content, your breach of these Terms or the law, or your dealings with other users —
          including, for employers, your hiring and engagement decisions.
        </p>
      </Section>

      <Section id="governing-law" title="16. Governing law and disputes" summary="Philippine law applies. Contact us first and we'll try to resolve it within 30 days.">
        <p>
          These Terms are governed by the laws of the Republic of the Philippines. Before starting
          any formal proceeding, please contact us at{" "}
          <a href={`mailto:${businessInfo.contact.legal}`} className={linkClass}>
            {businessInfo.contact.legal}
          </a>{" "}
          so we can try to resolve the issue informally within 30 days. Disputes that are not
          resolved are subject to the exclusive jurisdiction of {venue}, without affecting any
          consumer rights you have under the law of your country of residence.
        </p>
      </Section>

      <Section id="changes" title="17. Changes to these Terms" summary="We'll tell you about material changes and ask you to accept them.">
        <p>
          We may update these Terms as the service or the law changes. We will post the new version
          here with a new &quot;Last updated&quot; date. For material changes we will notify you by
          email or in the app, and ask you to accept the updated Terms before continuing to use your
          account.
        </p>
      </Section>

      <Section id="contact" title="18. Contact">
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${businessInfo.contact.legal}`} className={linkClass}>
            {businessInfo.contact.legal}
          </a>
        </p>
      </Section>
    </LegalPageShell>
  );
}
