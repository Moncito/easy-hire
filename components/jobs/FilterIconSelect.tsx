import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

type Props = {
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  ariaLabel: string;
};

export default function FilterIconSelect({ icon: Icon, value, onChange, options, ariaLabel }: Props) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/45"
        aria-hidden="true"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="w-full cursor-pointer appearance-none rounded-lg border border-navy/10 bg-white py-2 pl-9 pr-8 text-sm text-ink outline-none transition focus:border-marigold focus:ring-2 focus:ring-marigold/15"
      >
        {options.map((opt) => (
          <option key={opt.value || "empty"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35"
        aria-hidden="true"
      />
    </div>
  );
}
