"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type WorkspaceShellContextValue = {
  expanded: boolean;
  toggleExpanded: () => void;
};

const WorkspaceShellContext = createContext<WorkspaceShellContextValue>({
  expanded: false,
  toggleExpanded: () => {},
});

const STORAGE_KEY = "hiring-sidebar-expanded";

export function WorkspaceShellProvider({ children }: { children: React.ReactNode }) {
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
    <WorkspaceShellContext.Provider value={{ expanded, toggleExpanded }}>
      {children}
    </WorkspaceShellContext.Provider>
  );
}

export function useWorkspaceShell() {
  return useContext(WorkspaceShellContext);
}
