"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

const SLOT_ID = "employer-action-bar-slot";

type Props = {
  visible?: boolean;
  children: React.ReactNode;
};

export default function EmployerActionBar({ visible = true, children }: Props) {
  const { isPro } = useEmployerShell();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isPro) return;
    setSlot(document.getElementById(SLOT_ID));
  }, [isPro]);

  if (!visible) return null;

  if (isPro) {
    if (!slot) return null;

    return createPortal(
      <div
        className="relative border-t border-[color:var(--pro-border)] bg-[var(--pro-surface)] pb-16 shadow-[0_-12px_40px_rgba(32,36,43,0.08)] lg:pb-3"
        role="region"
        aria-label="Form actions"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-marigold" aria-hidden="true" />
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4 sm:px-8">{children}</div>
      </div>,
      slot
    );
  }

  return (
    <div
      className="sticky bottom-16 z-40 -mx-6 mt-6 rounded-t-2xl border-t border-ink/8 bg-white/95 px-6 py-3.5 shadow-[0_-12px_40px_rgba(32,36,43,0.08)] backdrop-blur-md sm:-mx-8 sm:px-8 lg:bottom-0"
      role="region"
      aria-label="Form actions"
    >
      {children}
    </div>
  );
}
