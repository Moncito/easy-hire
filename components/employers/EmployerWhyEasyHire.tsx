import { ShieldCheck, MessageCircle, BadgePercent, ClipboardCheck } from "lucide-react";

const REASONS = [
  {
    title: "Verified on both sides",
    detail: "Every employer passes manual review, and VAs build complete, verifiable profiles before applying.",
    icon: ShieldCheck,
  },
  {
    title: "Free messaging at launch",
    detail: "Chat directly with applicants in-platform — no per-message fees, no gated inbox.",
    icon: MessageCircle,
  },
  {
    title: "No salary markup",
    detail: "You pay your VA directly. EasyHire never takes a cut or marks up the rate you agree on.",
    icon: BadgePercent,
  },
  {
    title: "Every job admin-reviewed",
    detail: "We check postings before they go live to keep the marketplace free of fraud and scams.",
    icon: ClipboardCheck,
  },
];

export default function EmployerWhyEasyHire() {
  return (
    <section
      className="emp-bg-section relative w-full overflow-hidden px-6 py-20 md:py-24"
      aria-label="Why hire through EasyHire"
    >
      <div className="pointer-events-none absolute -right-40 top-10 h-[450px] w-[450px] rounded-full bg-teal/6 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <h2 className="emp-text font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            Why employers choose EasyHire
          </h2>
          <p className="emp-text-secondary mt-4 text-sm font-medium leading-relaxed md:text-base">
            Built to remove the risk from offshore hiring — for founders who don&apos;t
            have time to vet agencies or chase down recruiters.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {REASONS.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.title}
                className="emp-card flex gap-4 rounded-2xl border p-6 backdrop-blur-sm transition-colors duration-200 hover:border-teal/20"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/12">
                  <Icon className="h-5 w-5 text-teal" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="emp-text mb-1.5 font-display text-base font-bold tracking-tight">
                    {reason.title}
                  </p>
                  <p className="emp-text-secondary text-sm leading-relaxed">{reason.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
