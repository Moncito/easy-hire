"use client";

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
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-64 right-0 z-50 border-t border-ink/10 bg-white/95 shadow-[0_-8px_30px_rgba(32,36,43,0.08)] backdrop-blur-sm"
      role="region"
    >
      <div className={`mx-auto flex w-full items-center px-8 py-4 ${alignClasses[align]}`}>
        {children}
      </div>
    </div>
  );
}
