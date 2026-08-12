"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { createJobAlert } from "@/lib/client/job-alerts";

type Props = {
  keywords: string;
  category?: string;
};

export default function SaveSearchButton({ keywords, category }: Props) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function save() {
    if (pending || saved) return;
    setPending(true);
    try {
      const result = await createJobAlert({ keywords, category, frequency: "DAILY" });

      if (!result.ok) {
        toast.error(result.error || "Couldn't save this search");
        return;
      }

      setSaved(true);
      toast.success("Alert created — we'll email you matching roles.");
    } catch {
      toast.error("Couldn't save this search");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={pending || saved}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default ${
        saved
          ? "border-teal/30 bg-teal/8 text-teal"
          : "border-navy/10 text-ink/60 hover:border-marigold/30 hover:text-ink"
      }`}
    >
      {saved ? <Check className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      {saved ? "Alert saved" : "Save search"}
    </button>
  );
}
