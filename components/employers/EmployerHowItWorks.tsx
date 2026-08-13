import { FilePlus2, ShieldCheck, Users2, Handshake } from "lucide-react";

const STEPS = [
  {
    title: "Post your role",
    detail: "Describe the job, set your PHP budget, and publish in under five minutes.",
    icon: FilePlus2,
  },
  {
    title: "Admin reviews it",
    detail: "Our team checks every posting for legitimacy before it goes live — no fraud, no spam.",
    icon: ShieldCheck,
  },
  {
    title: "Applicants come in",
    detail: "Verified VAs with complete profiles apply directly. Review, shortlist, and message in one place.",
    icon: Users2,
  },
  {
    title: "Hire with confidence",
    detail: "Chat, interview, and bring your VA on board — no commission taken on the hire.",
    icon: Handshake,
  },
];

export default function EmployerHowItWorks() {
  return (
    <section
      className="emp-bg-section relative overflow-hidden border-b px-6 py-24 md:px-8 emp-border"
      aria-label="How hiring on EasyHire works"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-teal/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 text-center md:mb-20">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/8 px-3.5 py-1 text-xs font-semibold text-teal">
            For employers
          </div>
          <h2 className="emp-text font-display text-4xl font-extrabold tracking-tight md:text-6xl">
            From job post to hire
          </h2>
          <p className="emp-text-secondary mx-auto mt-4 max-w-lg text-sm font-medium md:text-base">
            Four steps, one dashboard. No agencies, no recruiter fees.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="emp-card group relative rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal/25 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/12 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5 text-teal" strokeWidth={1.8} />
                  </div>
                  <span className="font-display text-3xl font-extrabold text-teal/15">
                    0{i + 1}
                  </span>
                </div>
                <p className="emp-text mb-2 font-display text-base font-bold tracking-tight md:text-lg">
                  {step.title}
                </p>
                <p className="emp-text-secondary text-sm leading-relaxed">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
