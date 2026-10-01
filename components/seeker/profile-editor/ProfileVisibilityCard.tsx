import { Eye } from "lucide-react";
import { VISIBILITY_OPTIONS } from "@/lib/seeker/profile-format";
import type { ProfileVisibilityLevel } from "@/lib/validations/seeker";

type Props = {
  visibility: ProfileVisibilityLevel;
  onManage: () => void;
};

const DOT_CLASS: Record<ProfileVisibilityLevel, string> = {
  HIDDEN: "bg-ink/30",
  STANDARD: "bg-teal",
  PUBLIC: "bg-marigold",
};

export default function ProfileVisibilityCard({ visibility, onManage }: Props) {
  const opt = VISIBILITY_OPTIONS.find((o) => o.value === visibility) ?? VISIBILITY_OPTIONS[1];

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/8">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy/10 text-navy" aria-hidden="true">
          <Eye className="h-4 w-4" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Profile visibility</p>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[visibility]}`} aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">{opt.label}</p>
      </div>
      <p className="text-xs leading-relaxed text-ink/50">{opt.description}</p>
      <button
        type="button"
        onClick={onManage}
        className="mt-4 block w-full cursor-pointer rounded-xl border border-navy/15 px-4 py-2.5 text-center text-xs font-semibold text-navy transition hover:bg-navy/5"
      >
        Manage visibility
      </button>
    </div>
  );
}
