import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import BusinessDetails from "@/components/legal/BusinessDetails";
import { businessInfo } from "@/lib/legal/business-info";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Contact & Business Information",
  description: "Who operates EasyHire and how to reach us about support, billing, privacy, or legal matters.",
};

const linkClass = "font-medium text-navy underline-offset-2 hover:underline";

const toc = [
  { id: "operator", title: "Who runs EasyHire" },
  { id: "reach-us", title: "How to reach us" },
  { id: "report", title: "Report a scam or abuse" },
  { id: "complaints", title: "Complaints and escalation" },
];

export default function ContactPage() {
  const { contact } = businessInfo;
  const topics = [
    { topic: "Account help and general questions", email: contact.general },
    { topic: "Billing, subscriptions, and refunds", email: contact.general, link: { href: "/refund-policy", label: "Refund policy" } },
    { topic: "Privacy and data requests (Data Protection Officer)", email: contact.privacy, link: { href: "/privacy#your-rights", label: "Your rights" } },
    { topic: "Legal notices and intellectual property", email: contact.legal, link: { href: "/terms", label: "Terms" } },
  ];

  return (
    <LegalPageShell
      title="Contact & Business Information"
      description="Who operates EasyHire, and the fastest way to reach the right person."
      toc={toc}
      navSection="Contact"
      navIcon={Building2}
      navHint="Business information"
    >
      <Section id="operator" title="Who runs EasyHire">
        <BusinessDetails />
      </Section>

      <Section id="reach-us" title="How to reach us" summary="Email the address for your topic. We usually reply within 2 business days.">
        <div className="overflow-hidden rounded-xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Topic
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {topics.map((t) => (
                <tr key={t.topic} className="align-top">
                  <td className="px-4 py-3 text-ink">
                    {t.topic}
                    {t.link && (
                      <>
                        {" · "}
                        <Link href={t.link.href} className={`${linkClass} text-xs`}>
                          {t.link.label}
                        </Link>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${t.email}`} className={`${linkClass} break-all`}>
                      {t.email}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Signed in? Include the email address on your EasyHire account so we can find it quickly.
          We will never ask for your password or a one-time code.
        </p>
      </Section>

      <Section id="report" title="Report a scam or abuse" summary="Use the report button — it reaches our trust team with the right context attached.">
        <p>
          Every job, company page, profile, review, and message thread has a report button. Use it
          for scams, fees charged to applicants, harassment, or fake accounts. For urgent cases or
          if you can&apos;t use the button, email{" "}
          <a href={`mailto:${contact.general}`} className={linkClass}>
            {contact.general}
          </a>{" "}
          with screenshots. See our{" "}
          <Link href="/safety" className={linkClass}>
            safety tips
          </Link>{" "}
          for what to do if you&apos;ve lost money.
        </p>
      </Section>

      <Section id="complaints" title="Complaints and escalation">
        <p>
          If you&apos;re unhappy with how we handled something, reply to our message and ask for it
          to be escalated. For privacy complaints we can&apos;t resolve, you can contact the
          National Privacy Commission at{" "}
          <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer" className={linkClass}>
            privacy.gov.ph
          </a>
          .
        </p>
      </Section>
    </LegalPageShell>
  );
}
