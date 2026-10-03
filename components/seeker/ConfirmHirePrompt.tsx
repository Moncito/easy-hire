"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { confirmHire } from "@/lib/client/offers";

export type ConfirmHireItem = {
  applicationId: string;
  companyName: string;
  jobTitle: string;
};

function ConfirmRow({ item, onDone }: { item: ConfirmHireItem; onDone: (id: string) => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    setSubmitting(true);
    try {
      await confirmHire(item.applicationId);
      toast.success("Thanks for confirming.");
      onDone(item.applicationId);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't confirm. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-marigold/[0.07] px-4 py-3 ring-1 ring-marigold/20">
      <BadgeCheck className="h-5 w-5 shrink-0 text-[#8a5a10]" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-ink">
        <span className="font-semibold">{item.companyName}</span> marked you as hired for{" "}
        <span className="font-semibold">{item.jobTitle}</span>. Is that right?
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={submitting}
          aria-label={`Confirm you were hired by ${item.companyName} for ${item.jobTitle}`}
          className="rounded-full bg-marigold px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-marigold/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Confirming…" : "Yes, I was hired"}
        </button>
        <Link href="/seeker/messages" className="text-xs font-semibold text-ink/50 transition hover:text-navy">
          Not right? Message the employer
        </Link>
      </div>
    </li>
  );
}

/** Asks the VA to confirm hires an employer recorded. Renders nothing when there is nothing to confirm. */
export default function ConfirmHirePrompt({ items }: { items: ConfirmHireItem[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const visible = items.filter((i) => !done.has(i.applicationId));
  if (visible.length === 0) return null;

  return (
    <section aria-label="Confirm your hire">
      <ul className="space-y-2">
        {visible.map((item) => (
          <ConfirmRow
            key={item.applicationId}
            item={item}
            onDone={(id) => setDone((prev) => new Set(prev).add(id))}
          />
        ))}
      </ul>
    </section>
  );
}
