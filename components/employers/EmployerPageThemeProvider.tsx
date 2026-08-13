"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type EmployerTheme = "light" | "dark";

const STORAGE_KEY = "employer-marketing-theme";

type EmployerThemeContextValue = {
  theme: EmployerTheme;
  toggleTheme: () => void;
  mounted: boolean;
};

const EmployerThemeContext = createContext<EmployerThemeContextValue | null>(null);

export function useEmployerTheme() {
  const ctx = useContext(EmployerThemeContext);
  if (!ctx) {
    throw new Error("useEmployerTheme must be used within EmployerThemeProvider");
  }
  return ctx;
}

export function useEmployerThemeOptional() {
  return useContext(EmployerThemeContext);
}

/** Shared theme state — syncs via localStorage across marketing + workspace. */
export function EmployerThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<EmployerTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      // Hydrate theme from localStorage after mount (avoids SSR mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only hydration
      setTheme(stored);
    }
    setMounted(true);

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setTheme(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, mounted }),
    [theme, toggleTheme, mounted]
  );

  return <EmployerThemeContext.Provider value={value}>{children}</EmployerThemeContext.Provider>;
}

export function EmployerMarketingThemeShell({ children }: { children: ReactNode }) {
  const { theme, mounted } = useEmployerTheme();

  return (
    <div
      className="employer-marketing-page min-h-screen"
      data-employer-theme={mounted ? theme : "light"}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

/** @deprecated Use EmployerThemeProvider + EmployerMarketingThemeShell */
export function EmployerPageThemeProvider({ children }: { children: ReactNode }) {
  return (
    <EmployerThemeProvider>
      <EmployerMarketingThemeShell>{children}</EmployerMarketingThemeShell>
    </EmployerThemeProvider>
  );
}

/** @deprecated Use useEmployerTheme */
export const useEmployerMarketingTheme = useEmployerTheme;
