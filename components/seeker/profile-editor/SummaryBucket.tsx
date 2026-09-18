import { summaryHeadlineClassName, summaryBioClassName, type UpdateField } from "./shared";

type Props = {
  headline: string;
  bio: string;
  onChange: UpdateField;
};

export default function SummaryBucket({ headline, bio, onChange }: Props) {
  return (
    <div className="grid gap-6">
      <div>
        <label htmlFor="headline" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-ink/45">
          Headline
        </label>
        <input
          id="headline"
          value={headline}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="e.g. Executive VA · 5 yrs experience"
          className={summaryHeadlineClassName}
        />
      </div>
      <div>
        <label htmlFor="bio" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-ink/45">
          About you
        </label>
        <textarea
          id="bio"
          rows={7}
          value={bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Brief summary of your experience and what you're looking for..."
          className={summaryBioClassName}
        />
      </div>
    </div>
  );
}
