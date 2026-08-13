"use client";

type Props = {
  visible?: boolean;
  children: React.ReactNode;
};

export default function EmployerActionBar({ visible = true, children }: Props) {
  if (!visible) return null;

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
