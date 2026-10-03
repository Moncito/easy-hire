import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import { businessInfo } from "@/lib/legal/business-info";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Job Posting Guidelines",
  description: "What every EasyHire job post needs, what isn't allowed, and how review works.",
};

const linkClass = "font-medium text-navy underline-offset-2 hover:underline";

const toc = [
  { id: "who-can-post", title: "1. Who can post" },
  { id: "what-to-include", title: "2. What every post needs" },
  { id: "not-allowed", title: "3. Not allowed" },
  { id: "fair-hiring", title: "4. Fair hiring language" },
  { id: "review", title: "5. How review works" },
  { id: "enforcement", title: "6. If a post breaks the rules" },
];

const rewrites = [
  { bad: "Female, 22–30 years old, single", good: "Strong written English; available Mon–Fri, 9am–5pm EST" },
  { bad: "Must pay ₱1,500 for your training kit", good: "Paid onboarding during your first week" },
  { bad: "Fresh graduates only, below 25", good: "Entry level — no prior VA experience required" },
  { bad: "Earn up to $5,000/month!", good: "$6–8/hour, 30 hours/week, paid bi-weekly via Wise" },
  { bad: "Send a 2-day sample project before we talk", good: "Short paid test task (about 1 hour) after a first call" },
];

export default function JobPostingGuidelinesPage() {
  return (
    <LegalPageShell
      title="Job Posting Guidelines"
      description="Clear, honest posts get better applicants — and they're what keeps EasyHire safe for everyone."
      toc={toc}
      updated="October 1, 2026"
      navSection="Posting Guidelines"
      navIcon={ClipboardCheck}
      navHint="For employers"
    >
      <Section
        id="who-can-post"
        title="1. Who can post"
        summary="Real businesses and individuals hiring for real, open roles."
      >
        <p>
          You must be hiring for a genuine role that is open now, on behalf of a business or
          yourself, and be authorised to do so. Recruiters posting for a client must name the
          client or describe it accurately. These guidelines sit alongside our{" "}
          <Link href="/terms#employer-responsibilities" className={linkClass}>
            Terms of Service
          </Link>
          .
        </p>
      </Section>

      <Section
        id="what-to-include"
        title="2. What every post needs"
        summary="Honest title, real duties, actual pay, hours, and how the engagement works."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>An accurate title</strong> that matches the work (not &quot;CEO
            Assistant&quot; for a cold-calling role).
          </li>
          <li>
            <strong>Real duties and tools</strong> — what the person will actually do day to day.
          </li>
          <li>
            <strong>Pay</strong> as a rate or range, with currency and how often you pay. Avoid
            &quot;up to&quot; figures and commission-only pay presented as a salary.
          </li>
          <li>
            <strong>Hours and time zone</strong>, including any required overlap.
          </li>
          <li>
            <strong>Engagement type</strong> — full-time, part-time, or project; contractor or
            employee.
          </li>
          <li>
            <strong>Requirements that matter for the job</strong>: skills, experience, language
            level, equipment, internet speed.
          </li>
        </ul>
      </Section>

      <Section
        id="not-allowed"
        title="3. Not allowed"
        summary="Fees from applicants, scams, illegal work, and anything that harvests applicants' data."
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Charging applicants anything</strong> — application, training, &quot;starter
            kit&quot;, equipment, software, deposits, or placement fees.
          </li>
          <li>
            Pyramid, multi-level marketing, or &quot;recruit others to earn&quot; schemes, and
            reshipping, money-transfer, or crypto &quot;agent&quot; roles.
          </li>
          <li>Illegal work, adult or sexual services, gambling, or academic cheating.</li>
          <li>
            Asking for government ID numbers, bank or e-wallet details, passwords, or OTPs in the
            application.
          </li>
          <li>
            Sending applicants to outside links or chat apps to &quot;apply&quot; where they are
            asked for money or personal data.
          </li>
          <li>
            Unpaid test work longer than about an hour, or any test whose output you use as real
            work.
          </li>
          <li>Duplicate posts for the same role, or posts that are really ads for your product.</li>
        </ul>
      </Section>

      <Section
        id="fair-hiring"
        title="4. Fair hiring language"
        summary="Describe the work, not the person. No age, sex, civil status, religion, or similar requirements."
      >
        <p>
          Philippine law prohibits job ads that state preferences on age (RA 10911), sex or gender
          (RA 9710), or disability (RA 7277), and we apply the same standard to every employer on
          EasyHire. Don&apos;t ask for a photo, height, weight, civil status, religion, or ethnicity
          unless it is genuinely required by the job and allowed by law. Location, time-zone, and
          language requirements are fine when the work needs them.
        </p>
        <div className="overflow-hidden rounded-xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Instead of
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Write
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rewrites.map((r) => (
                <tr key={r.bad} className="align-top">
                  <td className="px-4 py-2 text-ink/55 line-through decoration-ink/30">{r.bad}</td>
                  <td className="px-4 py-2 text-ink">{r.good}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="review"
        title="5. How review works"
        summary="Free-plan posts are checked before going live. Verified Pro companies publish instantly, but stay monitored."
      >
        <p>
          Every post from a company on the Free plan is reviewed by our team before it becomes
          public. You get an email when it is approved, or a reason if it isn&apos;t, so you can
          fix it and resubmit.
        </p>
        <p>
          Companies on Employer Pro that have passed business verification can publish immediately.
          Their posts follow the same rules, are monitored, and can be unpublished at any time.
        </p>
      </Section>

      <Section
        id="enforcement"
        title="6. If a post breaks the rules"
        summary="We reject or remove it. Repeated or serious breaches lead to suspension."
      >
        <p>
          We may reject, unpublish, or remove a post and tell you why. Repeated breaches, or any
          attempt to charge or defraud applicants, can lead to suspension of the company and its
          team members, and we may report scams to the authorities. Applicants can flag posts with
          the report button on every job page. Questions about a decision:{" "}
          <a href={`mailto:${businessInfo.contact.general}`} className={linkClass}>
            {businessInfo.contact.general}
          </a>
          .
        </p>
      </Section>
    </LegalPageShell>
  );
}
