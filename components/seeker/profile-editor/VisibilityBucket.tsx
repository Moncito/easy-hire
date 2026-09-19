import Link from "next/link";
import { VISIBILITY_OPTIONS } from "@/lib/seeker/profile-format";
import type { ProfileVisibilityLevel } from "@/lib/validations/seeker";
import type { UpdateField } from "./shared";

type Props = {
  visibility: ProfileVisibilityLevel;
  profileId?: string;
  onChange: UpdateField;
};

export default function VisibilityBucket({ visibility, profileId, onChange }: Props) {
  return (
    <div className="space-y-3">
      {VISIBILITY_OPTIONS.map((opt) => {
        const selected = visibility === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange("visibility", opt.value)}
            className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              selected ? "border-marigold/40 bg-marigold/8" : "border-ink/10 bg-white hover:border-navy/20"
            }`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                selected ? "border-marigold bg-marigold" : "border-ink/25 bg-white"
              }`}
            >
              {selected && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{opt.label}</span>
              <span className="mt-0.5 block text-sm text-ink/55">{opt.description}</span>
            </span>
          </button>
        );
      })}
      {visibility === "PUBLIC" && profileId && (
        <div className="mt-4 rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-ink/70">
          <p className="font-semibold text-ink">Public profile link</p>
          <p className="mt-1 text-xs text-ink/55">
            Anyone with the link can view your public portfolio page.
          </p>
          <Link
            href={`/seekers/${profileId}`}
            target="_blank"
            className="mt-2 inline-block cursor-pointer text-sm font-semibold text-teal hover:underline"
          >
            View public page
          </Link>
        </div>
      )}
    </div>
  );
}
