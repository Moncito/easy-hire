import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  wrapperClassName?: string;
};

/** Pro neomorphic input — inset "carved" field instead of a bordered box. */
export default function NeoInput({ label, hint, wrapperClassName = "", className = "", id, ...rest }: Props) {
  return (
    <div className={wrapperClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[color:var(--neo-muted)]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`neo-inset-sm w-full rounded-xl border-0 px-3.5 py-2.5 text-sm text-[color:var(--neo-ink)] outline-none placeholder:text-[color:var(--neo-muted)] focus:ring-2 focus:ring-[color:var(--neo-teal)]/30 ${className}`}
        {...rest}
      />
      {hint && <p className="mt-1 text-[11px] text-[color:var(--neo-muted)]">{hint}</p>}
    </div>
  );
}
