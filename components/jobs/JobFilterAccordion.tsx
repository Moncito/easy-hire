"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function JobFilterAccordion({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-ink/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-ink/35 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="space-y-3 pb-4">{children}</div>}
    </div>
  );
}
