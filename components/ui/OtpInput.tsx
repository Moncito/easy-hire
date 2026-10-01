"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

export type OtpInputHandle = {
  /**
   * Focuses the field and selects its current value — mirrors the old plain
   * `<input>`'s `.focus(); .select();` pattern so callers that imperatively
   * re-focus on a step transition (e.g. LoginForm's `focusCodeToken`
   * effect) don't need to change how they call it.
   */
  focus: () => void;
};

type Accent = "marigold" | "teal";

const ACCENT_CLASSES: Record<Accent, string> = {
  marigold: "border-marigold ring-2 ring-marigold/25",
  teal: "border-teal ring-2 ring-teal/25",
};

type OtpInputProps = {
  id?: string;
  /** Digits only, length 0..`length`. Fully controlled — this component never keeps its own copy of the code. */
  value: string;
  onChange: (value: string) => void;
  /**
   * Fires once per change event that brings `value` to exactly `length`
   * digits — e.g. so a caller can auto-submit. Not re-fired by an unrelated
   * re-render; only by a change (typed, pasted, or autofilled) that
   * completes the code.
   */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Marigold for job-seeker surfaces, Signal Teal for employer surfaces (see CLAUDE.md). */
  accent?: Accent;
  /**
   * Tints every box Ember to flag that the code currently in them was
   * rejected. The caller owns the actual error copy / `aria-live` region —
   * this only controls box color, and only when the caller opts in (boxes
   * are never Ember at rest).
   */
  hasError?: boolean;
  className?: string;
};

/**
 * Segmented six-box verification-code input.
 *
 * Accessibility approach — single real input, not six:
 * Six real `<input>` elements announce to a screen reader as six separate,
 * confusingly-unlabelled text fields, and several browsers' "one-time-code"
 * SMS/iOS autofill fill them inconsistently (often only the first box gets
 * the code). Instead, this renders exactly ONE real, focusable
 * `<input type="text">` holding the whole code — it's what actually
 * receives typing, arrow-key navigation, paste, and autofill, and it's the
 * thing a screen reader announces. Given whatever `<label htmlFor>` /
 * `aria-label` the caller attaches (both callers already have one), it
 * already reads as a single labelled field with its value programmatically
 * available, exactly like any other text input — no `role="group"`
 * gymnastics needed. The six boxes underneath are purely decorative
 * (`aria-hidden`) and just mirror the real input's value/caret for sighted
 * users; the real input sits on top of them (transparent, but not
 * `display:none`, so it stays focusable and keeps native autofill/paste
 * behavior), sized to exactly cover the box row so clicks land on it.
 *
 * Native `<input>` behavior already provides most of the required
 * interaction for free: typing advances the caret automatically, Backspace
 * at the end of the value deletes the last digit (there's no separate
 * "empty box" state to manage — it's just "end of value"), and
 * Left/Right/Home/End move the real caret. On top of that we add: digit-only
 * filtering on keydown (so a non-digit key never reaches the DOM and never
 * flashes before being rejected), an `onPaste` handler that always replaces
 * the whole value regardless of where the caret was (so paste behaves the
 * same no matter which box was clicked first, and tolerates spaces/dashes),
 * and a synthetic per-box focus highlight driven by the real input's
 * `selectionStart` (since the real input itself is invisible and can't show
 * a native caret) — so both a click on a specific box and arrow-key
 * navigation move a visible highlight from box to box.
 */
const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  {
    id,
    value,
    onChange,
    onComplete,
    length = 6,
    disabled = false,
    autoFocus = false,
    name,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    accent = "marigold",
    hasError = false,
    className = "",
  },
  forwardedRef
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [caretIndex, setCaretIndex] = useState(0);

  useImperativeHandle(forwardedRef, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
  }));

  const syncCaret = useCallback(
    (el: HTMLInputElement | null) => {
      if (!el) return;
      const pos = el.selectionStart ?? el.value.length;
      setCaretIndex(Math.min(pos, length - 1));
    },
    [length]
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
    // selectionStart can briefly lag the new value right after a
    // programmatic/controlled change — read it next frame so the highlight
    // lands on the right box.
    requestAnimationFrame(() => syncCaret(inputRef.current));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // let shortcuts (copy/paste/select-all) through
    const navigationKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab", "Enter"];
    if (navigationKeys.includes(e.key)) return;
    // A single printable, non-digit character — block it outright so it
    // never reaches the DOM and never flashes before being stripped.
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(digits.length, digits.length);
      syncCaret(inputRef.current);
    });
  }

  function handleClick(e: MouseEvent<HTMLInputElement>) {
    const boxEls = boxRefs.current;
    let idx = value.length;
    for (let i = 0; i < boxEls.length; i++) {
      const box = boxEls[i];
      if (!box) continue;
      if (e.clientX < box.getBoundingClientRect().right) {
        idx = i;
        break;
      }
    }
    idx = Math.min(idx, length - 1);
    // Override whatever caret position the native click already produced
    // (based on the invisible input's own text layout, which won't line up
    // with the visible box grid) with the box the user actually clicked.
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(idx, idx);
      setCaretIndex(idx);
    });
  }

  function handleSelect(e: SyntheticEvent<HTMLInputElement>) {
    syncCaret(e.currentTarget);
  }

  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    setIsFocused(true);
    syncCaret(e.currentTarget);
  }

  function handleBlur() {
    setIsFocused(false);
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div aria-hidden="true" className="flex gap-2 sm:gap-2.5">
        {Array.from({ length }).map((_, i) => {
          const digit = value[i];
          const isActive = isFocused && !disabled && caretIndex === i;
          return (
            <div
              key={i}
              ref={(el) => {
                boxRefs.current[i] = el;
              }}
              className={[
                "flex h-12 w-10 items-center justify-center rounded-xl border-2 bg-ink/[0.03] font-data text-lg font-semibold text-ink sm:h-14 sm:w-12 sm:text-xl",
                "transition-colors motion-reduce:transition-none",
                hasError ? "border-ember" : isActive ? ACCENT_CLASSES[accent] : "border-ink/15",
                disabled ? "opacity-50" : "",
              ].join(" ")}
            >
              {digit ?? (isActive ? (
                <span
                  aria-hidden="true"
                  className="h-5 w-px animate-pulse bg-ink/50 motion-reduce:animate-none"
                />
              ) : null)}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={length}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={handleClick}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
});

export default OtpInput;
