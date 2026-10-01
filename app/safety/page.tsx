import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import { businessInfo } from "@/lib/legal/business-info";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Safety Tips",
  description: "How to spot job scams, protect your data, and report problems on EasyHire.",
};

const linkClass = "font-medium text-navy underline-offset-2 hover:underline";

const toc = [
  { id: "promise", title: "1. Our promise" },
  { id: "red-flags", title: "2. Red flags" },
  { id: "before-you-accept", title: "3. Before you accept an offer" },
  { id: "your-data", title: "4. Protect your data" },
  { id: "employers", title: "5. Tips for employers" },
  { id: "report", title: "6. If something goes wrong" },
];

const redFlags = [
  "Asks you to pay — for training, a starter kit, equipment, software, a “processing fee”, or a deposit.",
  "Sends you a cheque or transfer and asks you to send part of it back or buy gift cards.",
  "Asks for your bank or e-wallet login, card PIN, or a one-time password (OTP). No real employer ever needs these.",
  "Wants your government ID numbers or bank details before any offer is made.",
  "Pushes you off EasyHire to Telegram, WhatsApp, or Viber within the first message, especially with an unnamed company.",
  "Pay that is far above the norm for very little work, or vague duties with urgent pressure to start today.",
  "Interviews only by chat, or an interviewer who won't show their face or name the company.",
  "A company with no website, no verifiable presence, or an email from a free provider claiming to be a big brand.",
];

export default function SafetyPage() {
  return (
    <LegalPageShell
      title="Safety Tips"
      description="Most employers on EasyHire are genuine. These habits help you spot the few who aren't."
      toc={toc}
      updated="October 1, 2026"
      navSection="Safety"
      navIcon={ShieldCheck}
      navHint="Stay safe while job hunting"
    >
      <Section
        id="promise"
        title="1. Our promise"
        summary="You never pay EasyHire, and a real employer never asks you to pay them."
      >
        <p>
          EasyHire is free for job seekers — always. No employer on EasyHire is allowed to charge
          you to apply, train, or be hired. Anyone who asks for money is breaking our{" "}
          <Link href="/job-posting-guidelines#not-allowed" className={linkClass}>
            posting rules
          </Link>
          , and you should report them.
        </p>
      </Section>

      <Section id="red-flags" title="2. Red flags" summary="If you see one of these, stop and report it.">
        <ul className="space-y-2">
          {redFlags.map((flag) => (
            <li key={flag} className="flex gap-3 rounded-xl border border-ink/10 bg-white/60 p-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-marigold" aria-hidden="true" />
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="before-you-accept"
        title="3. Before you accept an offer"
        summary="Know who you're working for, and get the terms in writing."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Look for the <strong>Verified</strong> badge on the company profile. It means we
            reviewed the company&apos;s business documents. It reduces risk, but it is not a
            guarantee — still use your judgement.
          </li>
          <li>Search the company and the person hiring you. Check that their website and email match.</li>
          <li>
            Get the offer in writing: rate, currency, hours, time zone, payment method, and pay
            schedule.
          </li>
          <li>Keep your conversations on EasyHire until you&apos;ve agreed terms, so there&apos;s a record.</li>
          <li>Test tasks should be short. Long unpaid &quot;samples&quot; are a warning sign.</li>
        </ul>
      </Section>

      <Section
        id="your-data"
        title="4. Protect your data"
        summary="Share only what's needed, when it's needed."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Leave government ID numbers, your full home address, and bank details off your resume.
            Share them only after you&apos;ve accepted a genuine offer and only if needed for payment
            or contracts.
          </li>
          <li>
            Choose your profile visibility in your profile settings — Hidden, Standard, or Public.
            See our{" "}
            <Link href="/privacy#who-can-see" className={linkClass}>
              Privacy Policy
            </Link>{" "}
            for what each means.
          </li>
          <li>Never share passwords or OTPs with anyone, including people claiming to be from EasyHire.</li>
          <li>Turn on two-factor authentication in your account settings.</li>
        </ul>
      </Section>

      <Section id="employers" title="5. Tips for employers">
        <ul className="list-disc space-y-2 pl-5">
          <li>Do a live video call before hiring, and check the candidate matches their profile.</li>
          <li>Pay through traceable methods and keep a written agreement.</li>
          <li>
            Give new hires the least access they need. Use shared password managers rather than
            sending passwords in chat.
          </li>
          <li>Report candidates who impersonate others or ask you to pay them through unusual channels.</li>
        </ul>
      </Section>

      <Section
        id="report"
        title="6. If something goes wrong"
        summary="Report it on EasyHire first. If you lost money, contact your bank and the authorities too."
      >
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Stop</strong> — don&apos;t send money, codes, or documents.
          </li>
          <li>
            <strong>Report it on EasyHire</strong> using the report button on the job, company
            page, profile, or message thread, or email{" "}
            <a href={`mailto:${businessInfo.contact.general}`} className={linkClass}>
              {businessInfo.contact.general}
            </a>{" "}
            with screenshots.
          </li>
          <li>
            <strong>If you sent money or shared account details</strong>, contact your bank or
            e-wallet provider immediately to try to stop the transfer and secure your account.
          </li>
          <li>
            <strong>Report the scam</strong> to the Cybercrime Investigation and Coordinating Center
            (CICC) hotline <span className="font-mono">1326</span>, or to the PNP Anti-Cybercrime
            Group or NBI Cybercrime Division.
          </li>
        </ol>
      </Section>
    </LegalPageShell>
  );
}
