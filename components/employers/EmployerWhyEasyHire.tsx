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
      className="relative w-full overflow-hidden bg-mist px-6 py-20 md:py-24"
      aria-label="Why hire through EasyHire"
    >
      <div className="pointer-events-none absolute -right-40 top-10 h-[450px] w-[450px] rounded-full bg-teal/6 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
            Why employers choose EasyHire
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-ink/60 md:text-base">
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
                className="flex gap-4 rounded-2xl border border-ink/8 bg-white/60 p-6 backdrop-blur-sm transition-colors duration-200 hover:border-teal/20 hover:bg-white/90"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/12">
                  <Icon className="h-5 w-5 text-teal" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="mb-1.5 font-display text-base font-bold tracking-tight text-ink">
                    {reason.title}
                  </p>
                  <p className="text-sm leading-relaxed text-ink/65">{reason.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
