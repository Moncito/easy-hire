import { useEffect, useRef } from "react";
import { Lightbulb } from "lucide-react";
import { summaryHeadlineClassName, summaryBioClassName, type UpdateField } from "./shared";

const HEADLINE_MAX = 120;
const BIO_MAX = 1000;
const BIO_MAX_HEIGHT = 320;

type Props = {
  headline: string;
  bio: string;
  onChange: UpdateField;
};

export default function SummaryBucket({ headline, bio, onChange }: Props) {
  // Auto-grow with content instead of a fixed 7-row box — a short bio was
  // leaving a wall of empty space below it, pushing the Next button far
  // from the content it belongs to. Caps out and scrolls past
  // BIO_MAX_HEIGHT so a near-1000-char bio doesn't grow unbounded.
  const bioRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, BIO_MAX_HEIGHT)}px`;
  }, [bio]);

  return (
    <div className="grid gap-6">
      <div>
        <div className="mb-3 flex items-end justify-between gap-2">
          <label htmlFor="headline" className="text-xs font-semibold uppercase tracking-wider text-ink/45">
            Professional headline <span className="text-marigold" aria-hidden="true">*</span>
          </label>
          <span className="shrink-0 font-data text-xs text-ink/35">
            {headline.length}/{HEADLINE_MAX}
          </span>
        </div>
        <input
          id="headline"
          value={headline}
          maxLength={HEADLINE_MAX}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="e.g. Executive VA · 5 yrs experience"
          className={summaryHeadlineClassName}
        />
        <p className="mt-2 text-xs text-ink/40">
          Keep it short and specific. Example: Full Stack Developer | React & Node.js
        </p>
      </div>
      <div>
        <div className="mb-3 flex items-end justify-between gap-2">
          <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-ink/45">
            About you <span className="text-marigold" aria-hidden="true">*</span>
          </label>
          <span className="shrink-0 font-data text-xs text-ink/35">
            {bio.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          id="bio"
          ref={bioRef}
          rows={4}
          value={bio}
          maxLength={BIO_MAX}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Brief summary of your experience and what you're looking for..."
          className={`${summaryBioClassName} max-h-80 overflow-y-auto`}
        />
      </div>
      <div className="flex items-start gap-2.5 rounded-xl bg-marigold/10 px-4 py-3">
        <Lightbulb className="h-4 w-4 shrink-0 text-[#8a5a10]" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-[#8a5a10]">
          <span className="font-semibold">Tip:</span> A clear and detailed profile helps employers understand
          your background faster and increases your chances of getting noticed.
        </p>
      </div>
    </div>
  );
}
