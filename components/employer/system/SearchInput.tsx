"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cx } from "@/components/employer/system/cx";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "size"> & {
  /** Accessible name; shown as the placeholder when none is given. */
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  loading?: boolean;
  /** Keyboard hint on the right, e.g. "⌘K". Hidden on narrow screens. */
  shortcut?: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * The one search field: icon, placeholder, optional shortcut hint, a
 * loading spinner while results arrive, and a clear button once there's
 * text (Escape clears too). Empty-result messaging belongs to the list
 * it filters, not to the input.
 */
const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { label, value, onValueChange, loading = false, shortcut, size = "md", placeholder, className, onKeyDown, ...rest },
  ref
) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-control border border-eh-line bg-eh-surface px-2.5 text-eh-muted transition-colors duration-150 focus-within:border-eh-teal",
        size === "sm" ? "h-8" : "h-9",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <input
        ref={ref}
        type="search"
        aria-label={label}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onValueChange("");
          }
          onKeyDown?.(e);
        }}
        className="min-w-0 flex-1 bg-transparent text-ui text-eh-ink outline-none placeholder:text-eh-muted [&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="grid h-6 w-6 place-items-center rounded-[6px] hover:bg-eh-surface-2 hover:text-eh-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : (
        shortcut && (
          <kbd className="hidden rounded-[4px] border border-eh-line px-1.5 text-[11px] text-eh-muted sm:inline">{shortcut}</kbd>
        )
      )}
    </div>
  );
});

export default SearchInput;
