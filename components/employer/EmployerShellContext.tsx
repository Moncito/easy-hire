"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type EmployerShellContextValue = {
  expanded: boolean;
  toggleExpanded: () => void;
};

const EmployerShellContext = createContext<EmployerShellContextValue>({
  expanded: false,
  toggleExpanded: () => {},
});

const STORAGE_KEY = "employer-sidebar-expanded";

export function EmployerShellProvider({ children }: { children: React.ReactNode }) {
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
    <EmployerShellContext.Provider value={{ expanded, toggleExpanded }}>
      {children}
    </EmployerShellContext.Provider>
  );
}

export function useEmployerShell() {
  return useContext(EmployerShellContext);
}
