"use client";

import { useEmployerShell } from "@/components/employer/EmployerShellContext";

type Props = {
  visible?: boolean;
  children: React.ReactNode;
  align?: "7xl" | "6xl" | "full";
};

const alignClasses: Record<NonNullable<Props["align"]>, string> = {
  full: "max-w-none",
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
};

export default function EmployerActionBar({ visible = true, children, align = "full" }: Props) {
  const { expanded } = useEmployerShell();

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-16 right-0 z-50 border-t border-ink/8 bg-white/90 shadow-[0_-12px_40px_rgba(32,36,43,0.1)] backdrop-blur-md transition-[left] duration-200 ease-out lg:bottom-0 ${
        expanded ? "lg:left-52" : "lg:left-[60px]"
      } left-0`}
      role="region"
      aria-label="Form actions"
    >
      <div className={`mx-auto flex w-full items-center px-6 py-4 sm:px-8 ${alignClasses[align]}`}>
        {children}
      </div>
    </div>
  );
}
