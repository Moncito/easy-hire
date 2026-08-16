"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type EmployerPlan = "FREE" | "PRO";

type EmployerShellContextValue = {
  expanded: boolean;
  toggleExpanded: () => void;
  /** Company subscription plan for the signed-in employer. Defaults to
   * "FREE" for any consumer rendered outside EmployerShell (e.g. tests). */
  plan: EmployerPlan;
  isPro: boolean;
};

const EmployerShellContext = createContext<EmployerShellContextValue>({
  expanded: false,
  toggleExpanded: () => {},
  plan: "FREE",
  isPro: false,
});

const STORAGE_KEY = "employer-sidebar-expanded";

export function EmployerShellProvider({
  children,
  plan = "FREE",
}: {
  children: React.ReactNode;
  plan?: EmployerPlan;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <EmployerShellContext.Provider
      value={{ expanded, toggleExpanded, plan, isPro: plan === "PRO" }}
    >
      {children}
    </EmployerShellContext.Provider>
  );
}

export function useEmployerShell() {
  return useContext(EmployerShellContext);
}
