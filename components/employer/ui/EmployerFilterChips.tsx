"use client";

type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

type Props = {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
};

export default function EmployerFilterChips({ options, value, onChange }: Props) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              active
                ? "bg-ink text-mist shadow-sm"
                : "border border-ink/10 bg-white text-ink/60 hover:border-ink/20 hover:text-ink"
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`ml-1.5 font-data tabular-nums ${active ? "text-mist/70" : "text-ink/35"}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
