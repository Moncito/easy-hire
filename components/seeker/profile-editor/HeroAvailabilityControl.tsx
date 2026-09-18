"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { availabilityOptions } from "@/components/seeker/profile-editor/shared";
import { updateSeekerProfile } from "@/lib/client/profile";

type Props = {
  availability: string | null;
};

/**
 * Inline quick-edit for availability, sitting next to the seeker's name in
 * ProfileHeaderCard. Optimistically updates, PATCHes just this one field
 * (the server schema is fully partial), then reconciles on success/failure.
 */
export default function HeroAvailabilityControl({ availability }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<string | null>(availability);
  const [open, setOpen] = useState(false);

  async function handleSelect(next: string) {
    const previous = value;
    setValue(next);
    setOpen(false);

    const result = await updateSeekerProfile({ availability: next });

    if (!result.ok) {
      setValue(previous);
      toast.error(result.data.error || "Failed to update availability");
      return;
    }

    toast.success("Availability updated");
    router.refresh();
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/35 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur transition-opacity hover:opacity-85"
      >
        {value || "Set availability"}
        <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul
            role="listbox"
            aria-label="Availability"
            className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg"
          >
            {availabilityOptions.map((option) => (
              <li key={option} role="option" aria-selected={value === option}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium transition-colors hover:bg-marigold/10 ${
                    value === option ? "text-ink font-semibold" : "text-ink/70"
                  }`}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
