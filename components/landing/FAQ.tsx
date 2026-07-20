"use client";

import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { useState, useCallback, memo } from "react";

const faqs = [
  {
    question: "Is EasyHire free for job seekers?",
    answer: "Yes, EasyHire is 100% free for job seekers. You can build your premium profile, browse verified virtual assistant jobs, and apply to unlimited postings without ever entering a credit card.",
  },
  {
    question: "How are employers verified?",
    answer: "We take trust and safety seriously. Every employer undergoes manual security and business license checks by our administration team before they are authorized to post a job or view applicant details.",
  },
  {
    question: "What happens if an employer doesn't respond to my application?",
    answer: "We track response metrics for every company. If an employer fails to review applications within 7 business days, they receive automated warnings. Unresponsive employers are temporarily suspended to prevent applicant ghosting.",
  },
  {
    question: "How much does it cost employers to post a job?",
    answer: "Employers can get started with a free tier. We also offer featured job listings and flexible monthly subscriptions for agencies needing advanced tools, bulk candidate screening, and instant talent matching. Details are available on the pricing page.",
  },
];

// Sub-component for individual FAQ item.
// Deliberately has NO open/close animation — conditional render is the
// fastest, most responsive option and avoids layout/paint cost entirely.
// Wrapped in memo() so toggling one item doesn't re-render the others.
const FAQItem = memo(function FAQItem({
  faq,
  isOpen,
  onClick,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="faq-item overflow-hidden rounded-2xl border border-white/40 bg-white shadow-sm hover:border-navy/20 hover:shadow-md">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-display font-bold text-ink hover:text-navy"
      >
        <span className="text-sm md:text-base lg:text-lg tracking-tight leading-snug">{faq.question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-ink/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>

      {/* Simple conditional render - no animation. Fastest, most responsive. */}
      {isOpen && (
        <div className="border-t border-ink/5 px-6 py-5 bg-white/50">
          <p className="text-xs md:text-sm lg:text-base leading-relaxed text-ink/75">{faq.answer}</p>
        </div>
      )}
    </div>
  );
});

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = useCallback((idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  }, []);

  return (
    <section
      id="FAQ"
      className="relative border-b border-ink/10 bg-gradient-to-b from-mist to-mist/50 px-8 py-24 overflow-hidden"
    >
      {/* Decorative Drift Blob */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-navy/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-3xl relative z-10">
        {/* Header Block */}
        <div className="mb-16 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy/5 px-3.5 py-1 text-xs font-semibold text-navy">
            <Sparkles className="h-3 w-3 fill-navy/20" strokeWidth={2} />
            Support Center
          </div>
          <h2 className="font-display text-4xl md:text-7xl font-extrabold tracking-tight text-ink">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-sm md:text-base font-small text-ink/60 max-w-md mx-auto">
            Got questions? We have answers. If you can&apos;t find what you need here, reach out to our team.
          </p>
        </div>

        {/* FAQs List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <FAQItem
              key={faq.question}
              faq={faq}
              isOpen={openIndex === idx}
              onClick={() => handleToggle(idx)}
            />
          ))}
        </div>

        {/* Premium Bottom Help CTA */}
        <div
          className="mt-16 rounded-2xl border border-navy/20 bg-navy/5 p-8 text-center backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute -left-12 -top-12 h-24 w-24 rounded-full bg-navy/10 blur-xl pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 h-24 w-24 rounded-full bg-teal/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navy/15 text-navy">
              <HelpCircle className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="font-display text-lg font-bold text-ink tracking-tight">
              Still have questions?
            </p>
            <p className="mt-2 text-sm text-ink/60 max-w-sm">
              We&apos;re here to help. Reach out to our dedicated support team and we will get back to you shortly.
            </p>
            <a
              href="/contact"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-navy px-6 py-2.5 text-sm font-bold text-mist shadow-md transition-transform hover:scale-102 active:scale-98"
            >
              Get in touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}