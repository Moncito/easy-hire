import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import { businessInfo } from "@/lib/legal/business-info";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Refund & Cancellation Policy",
  description: "How Employer Pro subscriptions renew, how to cancel, and when EasyHire issues refunds.",
};

const linkClass = "font-medium text-navy underline-offset-2 hover:underline";

const toc = [
  { id: "seekers", title: "1. Job seekers are never charged" },
  { id: "subscriptions", title: "2. How Employer Pro billing works" },
  { id: "cancelling", title: "3. Cancelling" },
  { id: "refunds", title: "4. When we give refunds" },
  { id: "requesting", title: "5. How to request a refund" },
  { id: "processors", title: "6. PayMongo and Paddle orders" },
  { id: "chargebacks", title: "7. Chargebacks" },
  { id: "changes", title: "8. Price and policy changes" },
];

export default function RefundPolicyPage() {
  const contactMail = (
    <a href={`mailto:${businessInfo.contact.general}`} className={linkClass}>
      {businessInfo.contact.general}
    </a>
  );

  return (
    <LegalPageShell
      title="Refund & Cancellation Policy"
      description="How Employer Pro renews, how to cancel, and when we give your money back."
      doc="refunds"
      toc={toc}
      updated="October 1, 2026"
      navSection="Refund Policy"
      navIcon={ReceiptText}
      navHint="Billing & refunds"
    >
      <Section
        id="seekers"
        title="1. Job seekers are never charged"
        summary="EasyHire is free for seekers, always. If anyone asks you to pay to apply or be hired, report it."
      >
        <p>
          We never charge virtual assistants to create a profile, apply, message, or be hired, so
          there is nothing for seekers to refund. If an employer or anyone claiming to be from
          EasyHire asks you for money, do not pay — see our{" "}
          <Link href="/safety" className={linkClass}>
            safety tips
          </Link>{" "}
          and report it.
        </p>
      </Section>

      <Section
        id="subscriptions"
        title="2. How Employer Pro billing works"
        summary="Monthly, paid in advance, renews automatically until you cancel."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>Employer Pro is billed monthly, in advance, at the price shown at checkout.</li>
          <li>
            Your subscription <strong>renews automatically</strong> at the start of each billing
            period using the payment method on file, until you cancel.
          </li>
          <li>Applicable taxes are added at checkout and shown on your receipt.</li>
          <li>
            You can see your plan, next renewal date, and invoices any time on the Billing page of
            your employer account.
          </li>
        </ul>
      </Section>

      <Section
        id="cancelling"
        title="3. Cancelling"
        summary="Cancel anytime from Billing. You keep Pro until the end of the period you paid for."
      >
        <p>
          You can cancel from the Billing page at any time — no email or call needed. Cancelling
          stops the next renewal. You keep Employer Pro features until the end of the current paid
          period, then your company moves to the Free plan. Your jobs, applicants, and messages stay
          in your account; Pro-only features such as instant publishing and Easy AI simply switch
          off.
        </p>
      </Section>

      <Section
        id="refunds"
        title="4. When we give refunds"
        summary="Partly used months aren't refunded, but billing mistakes and early terminations by us are."
      >
        <p>
          Because you can cancel any time and keep access until the period ends, we don&apos;t
          refund partly used billing periods. We <strong>will</strong> refund you when:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>You were charged twice for the same period, or charged an incorrect amount.</li>
          <li>You were charged after you had already cancelled.</li>
          <li>
            We close your account or end your subscription without cause — you get back the unused
            part of the period.
          </li>
          <li>A refund is required by the consumer law that applies to you.</li>
        </ul>
        <p>
          If a serious problem on our side stopped you from using Pro for a long stretch, contact us
          — we review these case by case and may offer a refund or credit.
        </p>
      </Section>

      <Section
        id="requesting"
        title="5. How to request a refund"
        summary="Email us within 30 days of the charge with your receipt number."
      >
        <ol className="list-decimal space-y-2 pl-5">
          <li>Email {contactMail} within 30 days of the charge.</li>
          <li>
            Include the email on your EasyHire account, the receipt or invoice number, and a short
            reason.
          </li>
          <li>We reply within 5 business days with a decision.</li>
        </ol>
        <p>
          Approved refunds go back to the original payment method. Your bank or e-wallet usually
          takes 5–10 business days to show it.
        </p>
      </Section>

      <Section id="processors" title="6. PayMongo and Paddle orders">
        <p>
          <strong>Payments from the Philippines</strong> are processed by PayMongo; we issue
          approved refunds through PayMongo.
        </p>
        <p>
          <strong>Payments from outside the Philippines</strong> are sold by Paddle.com, our
          merchant of record. Paddle handles those refunds under its buyer terms. You can ask us or
          use the link on your Paddle receipt — either way, the refund is paid by Paddle.
        </p>
      </Section>

      <Section
        id="chargebacks"
        title="7. Chargebacks"
        summary="Please talk to us before disputing a charge with your bank."
      >
        <p>
          Most billing problems are fixed fastest by emailing us. If you open a chargeback instead,
          we may pause Employer Pro on the account until the dispute is resolved. Basic posting and
          hiring on the Free plan stay available.
        </p>
      </Section>

      <Section id="changes" title="8. Price and policy changes">
        <p>
          We give at least 30 days&apos; notice before a price increase applies to your next
          renewal, so you can cancel first. This policy forms part of our{" "}
          <Link href="/terms#billing" className={linkClass}>
            Terms of Service
          </Link>
          ; if we change it, we&apos;ll update the date above.
        </p>
      </Section>
    </LegalPageShell>
  );
}
