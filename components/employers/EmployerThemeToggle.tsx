"use client";

import { Moon, Sun } from "lucide-react";
import { useEmployerThemeOptional } from "@/components/employers/EmployerPageThemeProvider";

type Props = {
  variant?: "floating" | "topbar";
};

export default function EmployerThemeToggle({ variant = "floating" }: Props) {
  const ctx = useEmployerThemeOptional();
  const theme = ctx?.theme ?? "light";
  const toggleTheme = ctx?.toggleTheme;
  const mounted = ctx?.mounted ?? false;
  const isDark = theme === "dark";

  if (!mounted || !toggleTheme) {
    if (variant === "topbar") {
      return (
        <div className="h-9 w-9 rounded-lg opacity-0" aria-hidden="true" />
      );
    }
    return (
      <div
        className="fixed top-5 right-5 z-[60] h-10 w-[7.5rem] rounded-full opacity-0 sm:top-6 sm:right-6"
        aria-hidden="true"
      />
    );
  }

  if (variant === "topbar") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-lg p-2 text-ink/55 transition hover:bg-ink/[0.04] hover:text-ink employer-workspace-theme-toggle"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark Pro preview"}
        title={isDark ? "Light mode" : "Pro preview (beta)"}
      >
        {isDark ? (
          <Sun className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="employer-theme-toggle fixed top-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md sm:top-6 sm:right-6 sm:px-3.5"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark Pro preview"}
      title={isDark ? "Light mode" : "Dark Pro preview"}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      ) : (
        <Moon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{isDark ? "Light" : "Pro preview"}</span>
    </button>
  );
}
