import { AlertCircle, Clock } from "lucide-react";

type Props = {
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string | null;
};

export default function CompanyVerificationBanner({ status, rejectionReason }: Props) {
  if (status === "verified") return null;

  if (status === "rejected") {
    return (
      <div className="mb-5 flex gap-3 rounded-2xl border border-ember/20 bg-ember/5 px-4 py-3.5 sm:px-5">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-ink">Verification needs an update</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/60">
            {rejectionReason ||
              "Please review your documents below and resubmit for verification."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 flex gap-3 rounded-2xl border border-navy/10 bg-navy/[0.04] px-4 py-3.5 sm:px-5">
      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-ink">Verification under review</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/60">
          Our team typically reviews company profiles within 1–2 business days. You can still edit
          your profile and post jobs while waiting.
        </p>
      </div>
    </div>
  );
}
