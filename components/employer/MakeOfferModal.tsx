"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { validateOfferInput } from "@/lib/client/offers";
import type { CreateOfferInput } from "@/lib/validations/offer";

type Props = {
  open: boolean;
  candidateName: string;
  jobTitle: string;
  loading?: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (input: CreateOfferInput) => void;
};

const FIELD_MESSAGES: Record<string, string> = {
  title: "Enter a role title (up to 120 characters).",
  rateCents: "Enter an amount greater than zero.",
  hoursPerWeek: "Hours per week must be a whole number from 1 to 80.",
  startDate: "Choose a valid start date.",
  message: "Keep the message under 2,000 characters.",
};

const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal/20";
const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wider text-ink/45";

/** Outer returns null when closed so the dialog's form state resets on every opening. */
export default function MakeOfferModal({ open, ...props }: Props) {
  if (!open) return null;
  return <MakeOfferDialog {...props} />;
}

function MakeOfferDialog({
  candidateName,
  jobTitle,
  loading = false,
  error = "",
  onCancel,
  onSubmit,
}: Omit<Props, "open">) {
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  const loadingRef = useRef(loading);
  useEffect(() => {
    cancelRef.current = onCancel;
    loadingRef.current = loading;
  });

  const [title, setTitle] = useState(jobTitle);
  const [rateType, setRateType] = useState<"MONTHLY" | "HOURLY">("MONTHLY");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "PHP">("USD");
  const [hours, setHours] = useState("");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Body-scroll lock, Esc to close even when focus has left the dialog, and focus return.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loadingRef.current) cancelRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus?.();
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNumber = Number.parseFloat(amount.replace(/,/g, ""));
    const rateCents = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : 0;
    const hoursNumber = hours.trim() === "" ? undefined : Number(hours);
    const result = validateOfferInput({
      title,
      rateType,
      rateCents,
      currency,
      hoursPerWeek: hoursNumber,
      startDate: startDate || undefined,
      message: message.trim() || undefined,
    });
    if (!result.ok) {
      const friendly: Record<string, string> = {};
      for (const key of Object.keys(result.errors)) {
        friendly[key] = FIELD_MESSAGES[key] ?? result.errors[key];
      }
      setFieldErrors(friendly);
      return;
    }
    setFieldErrors({});
    onSubmit(result.data);
  }

  const titleId = `${uid}-title`;
  const errorFor = (key: string) =>
    fieldErrors[key] ? (
      <p id={`${uid}-${key}-error`} role="alert" className="mt-1 text-xs text-ember">
        {fieldErrors[key]}
      </p>
    ) : null;
  const describedBy = (key: string) => (fieldErrors[key] ? `${uid}-${key}-error` : undefined);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-xs" onClick={loading ? undefined : onCancel} />
      <div
        ref={dialogRef}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="true"
        onKeyDown={(e) => {
          // Keep candidate-panel shortcuts (j/k, arrows, Esc) from firing behind the dialog.
          if (e.key === "Escape") {
            e.preventDefault();
            if (!loading) onCancel();
          }
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id={titleId} className="font-display text-lg font-bold text-ink">
          Make an offer to {candidateName}
        </h2>
        <p className="mt-1 text-sm text-ink/55">
          They can accept or decline from their dashboard. Accepting marks them as hired.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor={`${uid}-role`} className={LABEL_CLASS}>
              Role title
            </label>
            <input
              id={`${uid}-role`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              aria-invalid={!!fieldErrors.title}
              aria-describedby={describedBy("title")}
              className={INPUT_CLASS}
            />
            {errorFor("title")}
          </div>

          <div>
            <span id={`${uid}-paytype`} className={LABEL_CLASS}>
              Pay type
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`${uid}-paytype`}
              className="mt-1.5 inline-flex rounded-xl border border-ink/10 bg-mist p-0.5"
            >
              {(["MONTHLY", "HOURLY"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={rateType === type}
                  onClick={() => setRateType(type)}
                  className={`rounded-[10px] px-3.5 py-1.5 text-sm font-semibold transition ${
                    rateType === type ? "bg-teal text-white shadow-sm" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {type === "MONTHLY" ? "Monthly" : "Hourly"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_6.5rem] gap-3">
            <div>
              <label htmlFor={`${uid}-amount`} className={LABEL_CLASS}>
                Amount {rateType === "MONTHLY" ? "per month" : "per hour"}
              </label>
              <input
                id={`${uid}-amount`}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder={rateType === "MONTHLY" ? "1000.00" : "5.00"}
                aria-invalid={!!fieldErrors.rateCents}
                aria-describedby={describedBy("rateCents")}
                className={`${INPUT_CLASS} font-data`}
              />
              {errorFor("rateCents")}
            </div>
            <div>
              <label htmlFor={`${uid}-currency`} className={LABEL_CLASS}>
                Currency
              </label>
              <select
                id={`${uid}-currency`}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "PHP")}
                className={INPUT_CLASS}
              >
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-hours`} className={LABEL_CLASS}>
                Hours per week <span className="font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id={`${uid}-hours`}
                type="number"
                min={1}
                max={80}
                step={1}
                inputMode="numeric"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                aria-invalid={!!fieldErrors.hoursPerWeek}
                aria-describedby={describedBy("hoursPerWeek")}
                className={`${INPUT_CLASS} font-data`}
              />
              {errorFor("hoursPerWeek")}
            </div>
            <div>
              <label htmlFor={`${uid}-start`} className={LABEL_CLASS}>
                Start date <span className="font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id={`${uid}-start`}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-invalid={!!fieldErrors.startDate}
                aria-describedby={describedBy("startDate")}
                className={`${INPUT_CLASS} font-data`}
              />
              {errorFor("startDate")}
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-message`} className={LABEL_CLASS}>
              Message <span className="font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id={`${uid}-message`}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              rows={4}
              placeholder="Anything the candidate should know before accepting."
              aria-describedby={describedBy("message")}
              className={INPUT_CLASS}
            />
            <p className="mt-1 text-right font-data text-[10px] text-ink/40">{message.length}/2000</p>
            {errorFor("message")}
          </div>

          {error ? (
            <p role="alert" className="text-sm text-ember">
              {error}
            </p>
          ) : null}

          <div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/3 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send offer"}
              </button>
            </div>
            <p className="mt-2 text-right text-xs text-ink/45">The candidate has 7 days to respond.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
