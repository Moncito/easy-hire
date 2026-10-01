"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { ComplianceIssue } from "@/lib/jobs/posting-compliance";

/**
 * Advisory callout shown above the job form's actions when the wording trips a
 * posting-guideline check. Marigold, not ember: nothing here blocks submit.
 * The live region stays mounted so screen readers announce issues as they appear.
 */
export default function PostingComplianceNotice({
  issues,
  autoPublish = false,
}: {
  issues: ComplianceIssue[];
  autoPublish?: boolean;
}) {
  return (
    <div aria-live="polite">
      {issues.length > 0 && (
        <section
          aria-labelledby="posting-compliance-heading"
          className="mb-4 rounded-xl border border-marigold/40 bg-marigold/10 p-4"
        >
          <h3
            id="posting-compliance-heading"
            className="flex items-center gap-2 font-display text-sm font-bold text-ink"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#8a5a10]" aria-hidden="true" />
            Review this wording before you post
          </h3>
          <ul className="mt-3 space-y-3">
            {issues.map((issue, i) => (
              <li key={`${issue.code}-${i}`} className="text-sm text-ink/80">
                <p>{issue.message}</p>
                {issue.excerpt && (
                  <blockquote className="mt-1 break-words rounded-md bg-white/70 px-2 py-1 font-mono text-xs text-ink/70">
                    &ldquo;{issue.excerpt}&rdquo;
                  </blockquote>
                )}
                <Link
                  href={issue.guidelineHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-navy underline underline-offset-2 hover:text-navy/80"
                >
                  See guideline
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink/65">
            {autoPublish
              ? "Posts with these phrases go to our team for review before going live."
              : "Our team will check this during review."}
          </p>
        </section>
      )}
    </div>
  );
}
