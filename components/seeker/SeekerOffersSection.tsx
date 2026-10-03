"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Clock, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { formatRate, respondToOffer, type SeekerOffer } from "@/lib/client/offers";

function companyInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

// Fixed zone + locale so server and client render the same text (the rest of the seeker area runs on PHT).
function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

function formatStart(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const MESSAGE_CLAMP_THRESHOLD = 160;

function OfferCard({ offer, onResolved }: { offer: SeekerOffer; onResolved: (id: string) => void }) {
  const router = useRouter();
  const uid = useId();
  const [submitting, setSubmitting] = useState<"accept" | "decline" | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [expanded, setExpanded] = useState(false);

  const company = offer.application.job.company;
  const jobTitle = offer.application.job.title;
  const longMessage = (offer.message?.length ?? 0) > MESSAGE_CLAMP_THRESHOLD;

  async function accept() {
    setSubmitting("accept");
    try {
      await respondToOffer(offer.id, { accept: true });
      toast.success("Offer accepted — congratulations!");
      onResolved(offer.id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept the offer. Please try again.");
      setSubmitting(null);
    }
  }

  async function decline() {
    setSubmitting("decline");
    try {
      const trimmed = reason.trim();
      await respondToOffer(offer.id, { accept: false, declineReason: trimmed || undefined });
      toast.success("Offer declined");
      onResolved(offer.id);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't decline the offer. Please try again.");
      setSubmitting(null);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-5 ring-1 ring-marigold/30 shadow-[0_2px_12px_rgba(242,169,59,0.10)]">
      <div className="flex items-start gap-3">
        {company.logoUrl ? (
          <Image
            src={company.logoUrl}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-ink/8"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/8 font-display text-sm font-bold text-navy"
            aria-hidden="true"
          >
            {companyInitials(company.companyName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{company.companyName}</p>
          <p className="truncate text-xs text-ink/50">{jobTitle}</p>
        </div>
        <p className="flex shrink-0 items-center gap-1 text-xs text-ink/55">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>Respond by</span>
          <time dateTime={offer.expiresAt} className="font-data font-semibold text-ink/70">
            {formatDeadline(offer.expiresAt)}
          </time>
        </p>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-ink">{offer.title}</p>
        <p className="mt-1 font-data text-2xl font-bold text-ink">{formatRate(offer)}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/55">
          {offer.hoursPerWeek ? (
            <span>
              <span className="font-data font-semibold text-ink/70">{offer.hoursPerWeek}</span> hours per week
            </span>
          ) : null}
          {offer.startDate ? (
            <span>
              Starts <span className="font-data font-semibold text-ink/70">{formatStart(offer.startDate)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {offer.message ? (
        <blockquote className="mt-4 border-l-2 border-marigold/50 pl-3 text-sm text-ink/70">
          <p className={expanded ? "whitespace-pre-line" : "line-clamp-3 whitespace-pre-line"}>{offer.message}</p>
          {longMessage ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-1 text-xs font-semibold text-ink/50 transition hover:text-navy"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          ) : null}
        </blockquote>
      ) : null}

      {declining ? (
        <div className="mt-4 rounded-xl bg-ink/[0.03] p-3.5">
          <label htmlFor={`${uid}-reason`} className="block text-xs font-semibold text-ink/60">
            Reason (optional) — shared with the employer
          </label>
          <textarea
            id={`${uid}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink outline-none focus:border-marigold focus:ring-1 focus:ring-marigold/30"
          />
          <p className="mt-1 text-right font-data text-[10px] text-ink/40">{reason.length}/500</p>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeclining(false)}
              disabled={submitting !== null}
              className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/30 hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={decline}
              disabled={submitting !== null}
              className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
            >
              {submitting === "decline" ? "Declining…" : "Confirm decline"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={accept}
            disabled={submitting !== null}
            aria-label={`Accept offer from ${company.companyName} for ${jobTitle}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-ink shadow-[0_3px_8px_rgba(242,169,59,0.35)] transition hover:bg-marigold/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {submitting === "accept" ? "Accepting…" : "Accept offer"}
          </button>
          <button
            type="button"
            onClick={() => setDeclining(true)}
            disabled={submitting !== null}
            aria-label={`Decline offer from ${company.companyName} for ${jobTitle}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/65 transition hover:border-ink/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Decline
          </button>
        </div>
      )}
    </li>
  );
}

/** Pending job offers, shown above everything else on the seeker dashboard. Renders nothing when there are none. */
export default function SeekerOffersSection({ offers }: { offers: SeekerOffer[] }) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const visible = offers.filter((o) => !resolved.has(o.id));
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="offers-heading" className="scroll-mt-28">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-marigold/15 text-[#8a5a10]"
          aria-hidden="true"
        >
          <FileText className="h-4 w-4" />
        </span>
        <h2 id="offers-heading" className="font-display text-lg font-bold text-ink">
          Job offers
          <span className="ml-2 font-data text-xs font-normal text-ink/40">{visible.length}</span>
        </h2>
      </div>
      <ul className="space-y-3">
        {visible.map((offer) => (
          <OfferCard key={offer.id} offer={offer} onResolved={(id) => setResolved((prev) => new Set(prev).add(id))} />
        ))}
      </ul>
    </section>
  );
}
