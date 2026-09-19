import { Sparkles } from "lucide-react";

type Props = {
  variant: "finish" | "verify";
  onAction: () => void;
};

export default function ProfileStandOutCard({ variant, onAction }: Props) {
  const isFinish = variant === "finish";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--color-ink)_0%,var(--color-navy)_55%,var(--color-teal)_100%)] p-5 text-white shadow-[0_12px_30px_-12px_rgba(30,58,95,0.45)]">
      <div
        className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-marigold/25 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <Sparkles className="h-4 w-4 text-marigold" aria-hidden="true" />
        <p className="mt-2 font-display text-sm font-bold">
          {isFinish ? "Make your profile stand out" : "Get verified to stand out"}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-white/70">
          {isFinish
            ? "A complete profile gets noticed faster by employers searching for talent."
            : "A verified badge tells employers you're a real, reachable person — it shows on your public profile."}
        </p>
        <button
          type="button"
          onClick={onAction}
          className="mt-4 w-full cursor-pointer rounded-xl bg-marigold px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-marigold/90"
        >
          {isFinish ? "Finish profile" : "Verify identity"}
        </button>
      </div>
    </div>
  );
}
