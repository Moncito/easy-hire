import { formatSalaryRange } from "@/lib/format";
import { TIMEZONE_OPTIONS } from "@/lib/seeker/profile-format";
import { inputClassName, availabilityOptions, type UpdateField } from "./shared";

type Props = {
  availability: string | null;
  timezone: string;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  onChange: UpdateField;
};

export default function NextRoleBucket({
  availability,
  timezone,
  desiredSalaryMin,
  desiredSalaryMax,
  onChange,
}: Props) {
  return (
    <div className="grid gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Availability</p>
        <div className="flex flex-wrap gap-2">
          {availabilityOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange("availability", opt)}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                availability === opt ? "border-ink bg-ink text-mist" : "border-ink/20 text-ink"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="timezone" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
          Your timezone
        </label>
        <p className="mb-3 text-sm text-ink/55">
          Helps employers know when you&apos;re available for overlap hours.
        </p>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => onChange("timezone", e.target.value)}
          className={inputClassName}
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-ink">Desired salary (USD/month)</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="salaryMin" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Minimum
            </label>
            <input
              id="salaryMin"
              type="number"
              min={0}
              value={desiredSalaryMin ?? ""}
              onChange={(e) =>
                onChange("desiredSalaryMin", e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="salaryMax" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Maximum
            </label>
            <input
              id="salaryMax"
              type="number"
              min={0}
              value={desiredSalaryMax ?? ""}
              onChange={(e) =>
                onChange("desiredSalaryMax", e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className={inputClassName}
            />
          </div>
        </div>
        {(desiredSalaryMin || desiredSalaryMax) && (
          <p className="mt-3 font-data text-sm text-ink/60">
            {formatSalaryRange(desiredSalaryMin, desiredSalaryMax)}
          </p>
        )}
      </div>
    </div>
  );
}
